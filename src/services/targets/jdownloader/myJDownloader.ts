import cipher from './myJDownloaderWebCrypto'

import { FetchOptions, useFetch } from '@/utils/fetchUtilities'

const MYJD_API_VERSION = 1
const MYJD_API_URL = 'https://api.jdownloader.org'
const MYJD_API_ENDPOINT_CONNECT = '/my/connect'
const MYJD_API_ENDPOINT_RECONNECT = '/my/reconnect'
const MYJD_API_ENDPOINT_DISCONNECT = '/my/disconnect'
const MYJD_API_ENDPOINT_LISTDEVICES = '/my/listdevices'
const MYJD_API_ENDPOINT_ADDLINKS = '/linkgrabberv2/addLinks'

export type AddLinksParams = {
  assignJobID?: boolean | null
  autoExtract?: boolean | null
  autostart?: boolean | null
  dataURLs?: string[] | null
  deepDecrypt?: boolean | null
  destinationFolder?: string | null
  downloadPassword?: string | null
  extractPassword?: string | null
  links?: string | null
  overwritePackagizerRules?: boolean | null
  packageName?: string | null
  priority?: 'HIGHEST' | 'HIGHER' | 'HIGH' | 'DEFAULT' | 'LOW' | 'LOWER' | 'LOWEST' | null
  sourceUrl?: string | null
}

export type Device = {
  id: string
  name: string
  type: string
  status: string
}

export type Devices = Device[]

export type ApiError = {
  src: 'MYJD' | 'DEVICE'
  type: string
  data: object | unknown
}

export class MyJDownloader {
  private username: string = ''
  private password: string = ''
  private appKey: string = ''
  private sessiontoken: string = ''
  private regaintoken: string = ''
  private serverSecret: string = ''
  private deviceSecret: string = ''
  private serverEncryptionToken: string = ''
  private deviceEncryptionToken: string = ''
  private devices: Devices = []
  private timeout: number = 30000

  constructor(username: string, password: string, appKey: string, timeout: number) {
    if (username === '') throw new Error('username is empty')
    if (password === '') throw new Error('password is empty')
    if (appKey === '') throw new Error('appKey is empty')
    this.username = username.toLowerCase()
    this.password = password
    this.appKey = appKey
    this.timeout = timeout
  }

  async connect(): Promise<boolean> {
    this.serverSecret = await cipher.sha256(`${this.username}${this.password}server`)
    this.deviceSecret = await cipher.sha256(`${this.username}${this.password}device`)
    const path = `${MYJD_API_ENDPOINT_CONNECT}?email=${encodeURIComponent(this.username)}&appkey=${encodeURIComponent(
      this.appKey
    )}`
    return this.connectToMyJD(path)
  }

  async reconnect(): Promise<boolean> {
    if (this.sessiontoken === '' || this.regaintoken === '') return this.connect()
    const path = `${MYJD_API_ENDPOINT_RECONNECT}?&appkey=${encodeURIComponent(
      this.appKey
    )}&sessiontoken=${encodeURIComponent(this.sessiontoken)}&regaintoken=${encodeURIComponent(this.regaintoken)}`
    return this.connectToMyJD(path)
  }

  async disconnect(): Promise<boolean> {
    if (this.sessiontoken != '') {
      const path = `${MYJD_API_ENDPOINT_DISCONNECT}?sessiontoken=${encodeURIComponent(this.sessiontoken)}`
      await this.fetchAndDecrypt(path, this.serverEncryptionToken)
    }
    this.sessiontoken = ''
    this.regaintoken = ''
    this.serverSecret = ''
    this.deviceSecret = ''
    this.serverEncryptionToken = ''
    this.deviceEncryptionToken = ''
    return true
  }

  async getDevices(): Promise<Devices> {
    if (this.sessiontoken === '') await this.connect()
    const path = `${MYJD_API_ENDPOINT_LISTDEVICES}?sessiontoken=${encodeURIComponent(this.sessiontoken)}`
    const json = (await this.fetchAndDecrypt(path, this.serverEncryptionToken)) as { list: Devices }
    this.devices = json.list
    return this.devices
  }

  async addLinks(deviceId: string, folder: string, links: string[]): Promise<boolean> {
    const params: AddLinksParams = {
      autostart: false,
      deepDecrypt: false,
      autoExtract: false,
      overwritePackagizerRules: false,
      links: links.join(','),
      dataURLs: [],
      packageName: null,
      extractPassword: null,
      sourceUrl: null,
      downloadPassword: null,
      destinationFolder: folder,
      assignJobID: true,
      priority: null,
    }
    return this.addLinksRaw(deviceId, params)
  }

  async addLinksRaw(deviceId: string, params: AddLinksParams): Promise<boolean> {
    return this.queryDevice(deviceId, MYJD_API_ENDPOINT_ADDLINKS, params)
  }

  private async connectToMyJD(path: string): Promise<boolean> {
    const json = (await this.fetchAndDecrypt(path, this.serverSecret)) as { sessiontoken: string; regaintoken: string }
    if (!json.sessiontoken) throw new Error('no sessiontoken received')
    this.sessiontoken = json.sessiontoken
    this.regaintoken = json.regaintoken
    this.serverEncryptionToken = await cipher.sha256UpdateKey(this.serverSecret, this.sessiontoken)
    this.deviceEncryptionToken = await cipher.sha256UpdateKey(this.deviceSecret, this.sessiontoken)
    return true
  }

  private async queryDevice(deviceId: string, endpoint: string, params: object | undefined): Promise<boolean> {
    if (this.devices.length === 0) await this.getDevices()
    if (this.devices.length === 0) throw new Error('no devices available')
    const device = this.devices.find((device) => device.id === deviceId || device.name === deviceId)
    if (!device) throw new Error('device not found')
    const devicePath = `/t_${encodeURIComponent(this.sessiontoken)}_${encodeURIComponent(device.id)}`
    await this.fetchAndDecrypt(devicePath, this.deviceEncryptionToken, endpoint, params)
    return true
  }

  private async fetchAndDecrypt(
    path: string,
    secret: string,
    endpoint: string = '',
    params: object | undefined = undefined
  ): Promise<{ [key: string]: unknown }> {
    const rid = Math.floor(Math.random() * 10e12)
    const options: FetchOptions = {
      timeout: this.timeout,
    }
    if (params) {
      const bodyParams = {
        apiVer: MYJD_API_VERSION,
        url: endpoint,
        params: [JSON.stringify(params)],
        rid: rid,
      }
      options.data = await cipher.aesEncrypt(secret, bodyParams)
      path += endpoint
    } else {
      path += `&rid=${rid}`
      const signature = await cipher.hmacSha256(secret, path)
      path += `&signature=${signature}`
    }
    options.url = MYJD_API_URL + path
    return useFetch(options).then(async (response) => {
      const encrypted = await response.text()
      const decrypted: { [key: string]: unknown } = JSON.parse(await cipher.aesDecrypt(secret, encrypted))
      if (!decrypted.rid || decrypted.rid != rid) throw new Error('rid missmatch')
      return decrypted
    })
  }
}

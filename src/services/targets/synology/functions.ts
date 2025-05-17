import { TargetSettings } from '../settings'

import { Settings } from './settings'

import { i18n } from '#imports'
import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { FetchOptions, generateFormData, JSONparse, useFetch } from '@/utils/fetchUtilities'

const ERROR_CODES = {
  100: 'Unknown error.',
  101: 'No parameter of API, method or version.',
  102: 'The requested API does not exist.',
  103: 'The requested method does not exist.',
  104: 'The requested version does not support the functionality.',
  105: 'The logged in session does not have permission.',
  106: 'Session timeout.',
  107: 'Session interrupted by duplicated login.',
  108: 'Failed to upload the file.',
  109: 'The network connection is unstable or the system is busy.',
  110: 'The network connection is unstable or the system is busy.',
  111: 'The network connection is unstable or the system is busy.',
  112: 'Preserve for other purpose.',
  113: 'Preserve for other purpose.',
  114: 'Lost parameters for this API.',
  115: 'Not allowed to upload a file.',
  116: 'Not allowed to perform for a demo site.',
  117: 'The network connection is unstable or the system is busy.',
  118: 'The network connection is unstable or the system is busy.',
  119: 'Invalid session.',
  400: 'No such account or incorrect password.',
  401: 'Disabled account.',
  402: 'Denied permission.',
  403: '2-factor authentication code required.',
  404: 'Failed to authenticate 2-factor authentication code.',
  406: 'Enforce to authenticate with 2-factor authentication code.',
  407: 'Blocked IP source.',
  408: 'Expired password cannot change.',
  409: 'Expired password.',
  410: 'Password must be changed.',
}

const downloadStation = {
  maxVersion: 1,
  path: '',
}

export type ApiResponse = {
  success: boolean
  data: {
    'sid': string
    'SYNO.API.Auth': {
      maxVersion: number
      minVersion: number
      path: string
    }
    'SYNO.DownloadStation2.Task': {
      maxVersion: number
      minVersion: number
      path: string
      requestFormat: 'JSON'
    }
  }
  error: {
    code: number
    message: string
  }
}

export const push = async (nzb: NZBFileObject, targetSettings: TargetSettings): Promise<void> => {
  const settings = targetSettings.settings as Settings
  log.info(`pushing file "${nzb.title}" to ${targetSettings.name}`)
  try {
    const sid = await authenticate(settings)
    const content = new Blob([nzb.getAsTextFile()], {
      type: 'text/xml',
    })
    const formData = {
      api: 'SYNO.DownloadStation2.Task',
      method: 'create',
      version: downloadStation.maxVersion.toString(),
      type: '"file"',
      destination: '""',
      create_list: 'false',
      mtime: Date.now().toString(),
      size: content.size.toString(),
      file: '["torrent"]',
      extract_password: '"' + nzb.password + '"',
      torrent: [content, nzb.getFilename()] as [Blob, string],
    }
    const options = setOptions(settings)
    options.path = downloadStation.path
    options.parameters = { _sid: sid }
    options.data = generateFormData(formData)
    options.timeout = 180000
    const synoData = await connect(options)
    if (synoData.success != true) {
      checkError(synoData)
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
    log.error(`error while pushing file "${nzb.title}" to ${targetSettings.name}`, error)
    throw error
  }
}

export const testConnection = async (targetSettings: TargetSettings): Promise<boolean> => {
  const settings = targetSettings.settings as Settings
  log.info(`testing connection to ${targetSettings.name}`)
  try {
    await authenticate(settings)
    return true
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`error while testing connection to ${targetSettings.name}`, error)
    throw error
  }
}

export const getCategories = async (targetSettings: TargetSettings): Promise<string[]> => {
  log.info(`getting the categories from ${targetSettings.name}`)
  try {
    throw new Error('not implemented')
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`error while getting the categories from ${targetSettings.name}`, error)
    throw e
  }
}

const setOptions = (settings: Settings, path: string = ''): FetchOptions => {
  const options: FetchOptions = {
    scheme: settings.scheme,
    host: settings.host,
    port: settings.port,
    basepath: (settings.basepath ? (settings.basepath.match(/^\/*(.*?)\/*$/)?.[1] ?? '') + '/' : '') + 'webapi/',
    path: path !== '' ? path : 'query.cgi',
    timeout: settings.timeout ? settings.timeout : 5000,
  }
  return options
}

const connect = async (options: FetchOptions): Promise<ApiResponse> => {
  try {
    const response = await useFetch(options)
    const responseText = await response.text()
    return JSONparse(responseText) as ApiResponse
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    throw error
  }
}

const checkError = (synoData: ApiResponse): void => {
  if (synoData.error.code) {
    throw new Error(ERROR_CODES[synoData.error.code as keyof typeof ERROR_CODES] ?? 'unknown error')
  } else {
    throw new Error('unreadable response')
  }
}

const authenticate = async (settings: Settings): Promise<string | void> => {
  const options = setOptions(settings)
  options.parameters = {
    api: 'SYNO.API.Info',
    version: 1,
    method: 'query',
    query: 'SYNO.API.Auth,SYNO.DownloadStation2.Task',
  }
  let synoData = await connect(options)
  if (synoData.success === true && synoData.data) {
    if (!synoData.data['SYNO.DownloadStation2.Task']) throw new Error('api endpoint for DownloadStation2 not available')
    downloadStation.path = synoData.data['SYNO.DownloadStation2.Task'].path
    downloadStation.maxVersion = synoData.data['SYNO.DownloadStation2.Task'].maxVersion
    options.path = synoData.data['SYNO.API.Auth'].path
    options.parameters = {
      api: 'SYNO.API.Auth',
      version: synoData.data['SYNO.API.Auth'].maxVersion,
      method: 'login',
      account: settings.username,
      passwd: settings.password,
      session: 'DownloadStation',
      format: 'sid',
    }
    synoData = await connect(options)
    if (synoData.success === true && synoData.data) {
      return synoData.data.sid
    }
  }
  checkError(synoData)
}

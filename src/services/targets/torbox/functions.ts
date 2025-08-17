import { TargetSettings } from '../settings'

import { Settings } from './settings'

import { i18n } from '#imports'
import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { FetchOptions, JSONparse, useFetch } from '@/utils/fetchUtilities'
import { Semaphore } from '@/utils/generalUtilities'
import { getBasenameFromFilename } from '@/utils/stringUtilities'

const MAX_CONCURRENT = 10

const dlSemaphore = new Semaphore(MAX_CONCURRENT)

const BASE_SCHEME = 'https'
const BASE_SERVER = 'api.torbox.app'
const API_VERSION = 'v1'

export const push = async (nzb: NZBFileObject, targetSettings: TargetSettings): Promise<void> => {
  const release = await dlSemaphore.acquire()
  try {
    const settings = targetSettings.settings as Settings
    log.info(`pushing file "${nzb.title}" to ${targetSettings.name}`)
    try {
      const options = setOptions(settings)
      options.path = 'usenet/asyncccreateusenetdownload'
      options.data = new FormData()
      options.data.append(
        'file',
        new Blob([nzb.getAsTextFile()], { type: 'application/octet-stream' }),
        nzb.getFilename()
      )
      options.data.append('name', getBasenameFromFilename(nzb.getFilename()))
      options.data.append('as_queued', settings.as_queued ? 'true' : 'false')
      if (nzb.password !== '') options.data.append('password', nzb.password)
      await connect(options)
    } catch (e) {
      const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
      log.error(`error while pushing file "${nzb.title}" to ${targetSettings.name}`, error)
      throw error
    }
  } finally {
    release()
  }
}

export const testConnection = async (targetSettings: TargetSettings): Promise<boolean> => {
  const settings = targetSettings.settings as Settings
  log.info(`testing connection to ${targetSettings.name}`)
  try {
    const options = setOptions(settings)
    options.path = 'usenet/mylist'
    await connect(options)
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

const setOptions = (settings: Settings): FetchOptions => {
  const options: FetchOptions = {
    scheme: BASE_SCHEME,
    host: BASE_SERVER,
    basepath: `/${API_VERSION}/api/`,
    responseType: 'text',
    timeout: settings.timeout ? settings.timeout : 30000,
  }
  options.headers = {
    Authorization: `Bearer ${settings.apiKey}`,
  }
  return options
}

const connect = async (options: FetchOptions): Promise<void> => {
  type TorboxResponse<T = unknown> = {
    success: boolean
    error?: string | null
    detail: string
    data: T
  }
  const fetchResponse = await useFetch(options)
  const response: TorboxResponse = JSONparse(await fetchResponse.text())
  if (response?.success === true) return
  if (response?.error) {
    throw new Error(response.error)
  } else if (response?.detail) {
    throw new Error(response.detail)
  } else {
    throw new Error('unreadable response')
  }
}

import { TargetSettings } from '../settings'

import { Settings } from './settings'

import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { FetchOptions, JSONparse, useFetch } from '@/utils/fetchUtilities'
import { Semaphore } from '@/utils/generalUtilities'
import { getBasenameFromFilename } from '@/utils/stringUtilities'

const MAX_CONCURRENT = 5

const dlSemaphore = new Semaphore(MAX_CONCURRENT)

export const push = async (nzb: NZBFileObject, targetSettings: TargetSettings): Promise<void> => {
  const release = await dlSemaphore.acquire()
  try {
    const settings = targetSettings.settings as Settings
    log.info(`pushing file "${nzb.title}" to ${targetSettings.name}`)
    try {
      const file = new Blob([nzb.getAsTextFile()], {
        type: 'application/octet-stream',
      })
      const options = setOptions(settings)
      const filename = getBasenameFromFilename(nzb.getFilename()).slice(0, 86) + '.nzb'
      options.basepath = 'api/transfer/create'
      ;(options.data as FormData).append('password', nzb.password)
      ;(options.data as FormData).append('src', file, filename)
      await connect(options)
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
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
    options.basepath = 'api/account/info'
    await connect(options)
    return true
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`error while testing connection to ${targetSettings.name}`, error)
    throw error
  }
}

export const getCategories = async (targetSettings: TargetSettings): Promise<string[]> => {
  log.info(`getting the categories from ${targetSettings.name}`)
  try {
    throw new Error('not implemented')
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`error while getting the categories from ${targetSettings.name}`, error)
    throw error
  }
}

const setOptions = (settings: Settings): FetchOptions => {
  const options: FetchOptions = {
    scheme: 'https',
    host: 'www.premiumize.me',
    responseType: 'text',
    timeout: settings.timeout,
  }
  options.data = new FormData()
  options.data.append('apikey', settings.apiKey)
  return options
}

const connect = async (options: FetchOptions): Promise<void> => {
  type PremiumizeResponse = {
    status: 'success' | 'error'
    message: string
  }
  const fetchResponse = await useFetch(options)
  const response: PremiumizeResponse = JSONparse(await fetchResponse.text())
  if (response?.status === 'success') return
  if (response?.status === 'error') {
    throw new Error(response.message ? response.message : 'unknown Error')
  } else {
    throw new Error('unreadable response')
  }
}

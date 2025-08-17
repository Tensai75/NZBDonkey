import { TargetSettings } from '../settings'

import { Settings } from './settings'

import { i18n } from '#imports'
import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { FetchOptions, JSONparse, useFetch } from '@/utils/fetchUtilities'
import { Semaphore } from '@/utils/generalUtilities'
import { b64EncodeUnicode } from '@/utils/stringUtilities'

const MAX_CONCURRENT = 5

const dlSemaphore = new Semaphore(MAX_CONCURRENT)

type NzbGetApiResponse = {
  jsonrpc: string // The version of JSON-RPC used, typically "2.0"
  id: number | string // Unique identifier for the request
  result: NzbGetResult // The result object containing the data returned from the API
  error?: NzbGetApiError // If there was an error, this will contain the error details
}
type NzbGetResult = string | number | { Name: string; Value: string }[]
type NzbGetApiError = {
  code: number // Numeric error code
  message: string // Error message describing what went wrong
  data?: string // Optional additional error data
}

export const push = async (
  nzb: NZBFileObject,
  targetSettings: TargetSettings & { selectedCategory?: string }
): Promise<void> => {
  const release = await dlSemaphore.acquire()
  try {
    const settings = targetSettings.settings as Settings
    log.info(`pushing file "${nzb.title}" to ${targetSettings.name}`)
    try {
      const options = setOptions(settings)
      const clonedNZB = Object.assign(new NZBFileObject(), nzb)
      if (targetSettings.selectedCategory && clonedNZB.settings?.addCategory) {
        clonedNZB.addMetaInformation('category', targetSettings.selectedCategory)
      }
      const params = [
        nzb.getFilename(), // Filename
        b64EncodeUnicode(clonedNZB.getAsTextFile()), // Content (NZB File)
        typeof targetSettings.selectedCategory === 'string' ? targetSettings.selectedCategory : '', // Category
        0, // Priority
        false, // AddToTop
        settings.addPaused, // AddPaused
        '', // DupeKey
        0, // DupeScore
        settings.dupeMode, // DupeMode
        [
          { '*unpack:password': nzb.password.toString() as string }, // Post processing parameter: Password
        ],
      ]
      options.data = JSON.stringify({
        version: '1.1',
        id: 1,
        method: 'append',
        params: params,
      })
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
    options.data = JSON.stringify({
      version: '1.1',
      id: 1,
      method: 'version',
    })
    if (await connect(options)) {
      return true
    } else {
      throw new Error('Unknown Error')
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`error while testing connection to ${targetSettings.name}`, error)
    throw error
  }
}

export const getCategories = async (targetSettings: TargetSettings): Promise<string[]> => {
  const settings = targetSettings.settings as Settings
  log.info(`getting the categories from ${targetSettings.name}`)
  try {
    const options = setOptions(settings)
    options.data = JSON.stringify({
      version: '1.1',
      id: 1,
      method: 'config',
    })
    const response: NzbGetResult = await connect(options)
    const categories: string[] = []
    if (Array.isArray(response)) {
      response.forEach(function (element) {
        if (element.Name.match(/^category\d+\.name$/i)) {
          categories.push(element.Value)
        }
      })
    }
    return categories
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`error getting the categories from ${targetSettings.name}`, error)
    throw error
  }
}

const setOptions = (settings: Settings): FetchOptions => {
  const options: FetchOptions = {
    scheme: settings.scheme,
    host: settings.host,
    port: settings.port,
    username: settings.username,
    password: settings.password,
    path: 'jsonrpc/',
    basepath: '',
    responseType: 'text',
    timeout: settings.timeout,
    data: '',
  }
  if (settings.basepath && settings.basepath != '') {
    const basepathMatch = settings.basepath.match(/^\/*(.*?)\/*$/)
    options.basepath = basepathMatch ? basepathMatch[1] + '/' : ''
  }
  return options
}

const connect = async (options: FetchOptions): Promise<NzbGetResult> => {
  try {
    const fetchResponse = await useFetch(options)
    const responseText = await fetchResponse.text()
    const response: NzbGetApiResponse = JSONparse(responseText)
    if (response.result) {
      return response.result
    } else if (response.error) {
      throw new Error(`${response.error.code} - ${response.error.message}`)
    } else {
      throw new Error('unknown error')
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    throw error
  }
}

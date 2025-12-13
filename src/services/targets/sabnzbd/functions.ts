import { TargetSettings } from '../settings'

import { Settings } from './settings'

import { i18n } from '#imports'
import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { FetchOptions, generateFormData, JSONparse, useFetch } from '@/utils/fetchUtilities'
import { Semaphore } from '@/utils/generalUtilities'

const MAX_CONCURRENT = 5

const dlSemaphore = new Semaphore(MAX_CONCURRENT)

type SabnzbdApiResponse = {
  status: boolean
  nzo_ids?: string[]
  categories?: string[]
  error?: string
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
      const content = new Blob([clonedNZB.getAsTextFile()], {
        type: 'text/xml',
      })
      const filename = nzb.getFilename()
      const addPaused = settings.addPaused ? -2 : -100
      const formData = {
        mode: 'addfile',
        output: 'json',
        apikey: settings.apiKey,
        nzbname: filename,
        password: nzb.password,
        cat: typeof targetSettings.selectedCategory === 'string' ? targetSettings.selectedCategory : '',
        priority: addPaused.toString(),
        name: [content, filename] as [Blob | File, string],
      }
      options.data = generateFormData(formData)
      const response = (await connect(options)) as SabnzbdApiResponse
      if (response.status) return
      if (response?.error) {
        throw new Error(response.error)
      } else {
        throw new Error(i18n.t('errors.unknownError'))
      }
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
    const formData = {
      mode: 'status',
      output: 'json',
      apikey: settings.apiKey,
    }
    options.data = generateFormData(formData)
    const response = await connect(options)
    if (response?.status) {
      return true
    } else {
      if (response?.error) {
        throw new Error(response.error)
      } else {
        throw new Error('unknown error')
      }
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`error while testing connection to ${targetSettings.name}`, error)
    throw error
  }
}

export const getCategories = async (targetSettings: TargetSettings): Promise<string[]> => {
  const settings = targetSettings.settings as Settings
  log.info(`getting the categories from ${targetSettings.name}`)
  try {
    const options = setOptions(settings)
    const formData = {
      mode: 'get_cats',
      output: 'json',
      apikey: settings.apiKey,
      name: '',
    }
    options.data = generateFormData(formData)
    const response = await connect(options)
    if (response?.categories) {
      const index = response.categories.indexOf('*')
      if (index > -1) {
        response.categories.splice(index, 1)
      }
      return response.categories
    } else {
      throw new Error('no categories received')
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`error while getting the categories from ${targetSettings.name}`, error)
    throw error
  }
}

const setOptions = (settings: Settings): FetchOptions => {
  const options: FetchOptions = {
    scheme: settings.scheme,
    host: settings.host,
    port: settings.port,
    username: settings.basicAuthUsername,
    password: settings.basicAuthPassword,
    path: 'api',
    timeout: settings.timeout,
    data: '',
  }
  if (settings.basepath && settings.basepath != '') {
    const basepathMatch = settings.basepath.match(/^\/*(.*?)\/*$/)
    options.basepath = basepathMatch ? basepathMatch[1] + '/' : ''
  }
  return options
}

const connect = async (options: FetchOptions): Promise<SabnzbdApiResponse> => {
  try {
    const response = await useFetch(options)
    const responseText = await response.text()
    return JSONparse(responseText) as SabnzbdApiResponse
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    throw error
  }
}

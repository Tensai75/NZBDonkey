import jsonpath from 'jsonpath/'

import { SearchEngine } from '../settings'

import { Settings } from './settings'

import log from '@/services/logger/debugLogger'
import { FetchOptions, useFetch } from '@/utils/fetchUtilities'

export const getNZB = async (header: string, settings: SearchEngine): Promise<string> => {
  const engine = settings as SearchEngine & { settings: Settings }
  const response = await search(header, engine)
  const nzbID = checkresponse(response, engine)
  const downloadOptions = setOptions(nzbID, engine)
  return await download(downloadOptions, engine)
}

const search = async (header: string, engine: SearchEngine & { settings: Settings }): Promise<string> => {
  log.info(`searching search engine "${engine.name}" for header: ${header}`)
  if (engine.settings.removeUnderscore) {
    header = header.replace('_', ' ')
  }
  if (engine.settings.removeHyphen) {
    header = header.replace('-', ' ')
  }
  if (engine.settings.setIntoQuotes) {
    header = `"${header}"`
  }
  const nzbSearchURL = engine.settings.searchURL.replace(/%s/, encodeURI(header))
  log.info(`Search URL for search engine "${engine.name}" is set to: ${nzbSearchURL}`)
  const options: FetchOptions = {
    url: nzbSearchURL,
    responseType: 'text',
    timeout: 10000,
  }
  try {
    const response = await (await useFetch(options)).text()
    log.info(`Search engine "${engine.name}" has sent a response`)
    return response
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.warn(`error while searching on search engine "${engine.name}"`, error)
    throw error
  }
}

const checkresponse = (response: string, engine: SearchEngine & { settings: Settings }): string => {
  try {
    log.info(`checking the search results from search engine "${engine.name}"`)
    if (engine.settings.responseType === 'html') {
      try {
        const re = new RegExp(engine.settings.searchPattern, 'i')
        if (re.test(response)) {
          const match = response.match(re)
          if (match) {
            const nzbID = match[engine.settings.searchGroup]
            log.info(`NZB file ID found in the response from search engine "${engine.name}"`)
            return nzbID
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        throw new Error(`no valid search pattern`)
      }
      throw new Error(`no search results`)
    } else if (engine.settings.responseType === 'json') {
      let response_JSON
      try {
        response_JSON = JSON.parse(response)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        throw new Error(`no valid JSON response`)
      }
      let nzbID
      try {
        nzbID = jsonpath.nodes(response_JSON, `$.${engine.settings.searchPattern}`)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        throw new Error(`no valid JSON object path`)
      }
      if (nzbID[0]?.value) {
        log.info(`NZB file ID found in the response from search engine "${engine.name}"`)
        return nzbID[0].value
      } else {
        throw new Error(`no search results`)
      }
    } else {
      throw new Error(`no valid searchType`)
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.warn(`error while checking the search results from search engine "${engine.name}"`, error)
    throw error
  }
}

const setOptions = (nzbID: string, engine: SearchEngine & { settings: Settings }): FetchOptions => {
  const nzbDownloadURL = engine.settings.downloadURL.replace(/%s/, nzbID)
  log.info(
    `the download URL for NZB file with ID ${nzbID} from search engine "${engine.name}" is set to ${nzbDownloadURL}`
  )
  return {
    url: nzbDownloadURL,
    responseType: 'text',
    timeout: 60000,
  }
}

const download = async (options: FetchOptions, engine: SearchEngine & { settings: Settings }): Promise<string> => {
  try {
    return await (await useFetch(options)).text()
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.warn(`error while trying to download the NZB file from search engine "${engine.name}"`, error)
    throw error
  }
}

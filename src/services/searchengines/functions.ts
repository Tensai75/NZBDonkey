import { SearchEngine } from './settings'

import log from '@/services/logger/debugLogger'
import { NZBObject, textToNzbObject } from '@/services/nzbfile/nzbObject'
import { FetchOptions, useFetch } from '@/utils/fetchUtilities'

export const cleanHeader = (header: string, engine: SearchEngine): string => {
  if (engine.settings.removeUnderscore) {
    header = header.replace('_', ' ')
  }
  if (engine.settings.removeHyphen) {
    header = header.replace('-', ' ')
  }
  if (engine.settings.setIntoQuotes) {
    header = `"${header}"`
  }
  return header
}

export const search = async (header: string, options: FetchOptions, engine: SearchEngine): Promise<string> => {
  header = cleanHeader(header, engine)
  log.info(`searching search engine "${engine.name}" for header: ${header}`)
  try {
    const searchOptions = setURL(options, engine.settings.searchURL, header)
    log.info(`Search url is: ${searchOptions.url}`)
    const response = await (await useFetch(searchOptions)).text()
    log.info(`Search engine "${engine.name}" has sent a response`)
    return response
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.warn(`error while searching on search engine "${engine.name}"`, error)
    throw error
  }
}

export const setURL = (options: FetchOptions, url: string, searchString: string = ''): FetchOptions => {
  url = url.replace(/%s/, searchString)
  return {
    ...options,
    url: url,
  }
}

export const download = async (options: FetchOptions, engine: SearchEngine): Promise<NZBObject> => {
  let nzbTextFile: string
  try {
    nzbTextFile = await (await useFetch(options)).text()
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.warn(`error while trying to download the NZB file from search engine "${engine.name}"`, error)
    throw error
  }
  let nzbFile: NZBObject
  try {
    nzbFile = textToNzbObject(nzbTextFile)
    log.info(`the response from search engine "${engine.name}" is a valid NZB file`)
    return nzbFile
  } catch {
    log.warn(`the response from search engine "${engine.name}" is not a valid NZB file`)
    throw new Error(`not a valid NZB file`)
  }
}

export const convertToNzbObject = (nzbTextFile: string, engine: SearchEngine): NZBObject => {
  let nzbFile: NZBObject
  try {
    nzbFile = textToNzbObject(nzbTextFile)
    log.info(`the response from search engine "${engine.name}" is a valid NZB file`)
  } catch {
    log.warn(`the response from search engine "${engine.name}" is not a valid NZB file`)
    throw new Error('not a valid NZB file')
  }
  return nzbFile
}

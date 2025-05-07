import { SearchEngine } from '../settings'

import { Settings } from './settings'

import log from '@/services/logger/debugLogger'
import { FetchOptions, useFetch } from '@/utils/fetchUtilities'

const EASYNEWS_SEARCH_URL =
  'https://members.easynews.com/2.0/search/solr-search/?fly=2&pby=1000&pno=1&s1=nsubject&s1d=%2B&s2=nrfile&s2d=%2B&s3=dsize&s3d=%2B&sS=0&st=adv&safeO=0&sb=1&sbj='
const EASYNEWS_DOWNLOADA_URL = 'https://members.easynews.com/2.0/api/dl-nzb'

export const getNZB = async (header: string, settings: SearchEngine): Promise<string> => {
  const engine = settings as SearchEngine & { settings: Settings }
  const response = await search(header, engine)
  const results = await checkresponse(response, engine)
  const downloadOptions = setOptions(results, engine)
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
  const nzbSearchURL = EASYNEWS_SEARCH_URL + encodeURIComponent(header)
  log.info(`search URL for search engine "${engine.name}" is set to: ${nzbSearchURL}`)
  const options: FetchOptions = {
    url: nzbSearchURL,
    responseType: 'text',
    timeout: 10000,
    username: engine.settings.username,
    password: engine.settings.password,
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

const checkresponse = async (
  response: string,
  engine: SearchEngine & { settings: Settings }
): Promise<Array<{ [key: string]: string }>> => {
  try {
    log.info(`checking the response from search engine "${engine.name}"`)
    let response_JSON
    try {
      response_JSON = JSON.parse(response)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new Error(`search engine "${engine.name}" did not return a valid JSON response`)
    }
    if (!response_JSON.data) throw new Error(`search engine "${engine.name}" did not return any results`)
    const results: { [key: string]: Array<{ [key: string]: string }> } = {}
    // loop through the search results
    for (const item of response_JSON.data as Array<{ [key: string]: string }>) {
      // generate a hash of the base filename and the poster name
      const matchResult = item[10].match(/^([^.]*?)(?:\.|$)/im)
      if (matchResult) {
        const basefilename: string = matchResult[1]
        const hash = await digestMessage(basefilename + item[7])
        // group results belonging together based on the hash
        if (!results[hash]) {
          results[hash] = new Array<{ [key: string]: string }>()
        }
        results[hash].push(item)
      }
    }

    // if there are results get the NZB file of first result
    if (Object.keys(results).length >= 1) {
      return results[Object.keys(results)[0]]
    } else {
      throw new Error(`search engine "${engine.name}" did not return any results`)
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.warn(`error while checking the response from search engine "${engine.name}" for the NZB file ID`, error)
    throw error
  }
}

const setOptions = (
  results: Array<{ [key: string]: string }>,
  engine: SearchEngine & { settings: Settings }
): FetchOptions => {
  const formData = new FormData()
  formData.append('autoNZB', '1')
  for (const [key, item] of Object.entries(results)) {
    formData.append(`${key}&sig=${item.sig}`, `${item[0]}|${encodeFileName(item[10], item[11])}`)
  }
  return {
    url: EASYNEWS_DOWNLOADA_URL,
    responseType: 'text',
    timeout: 60000,
    username: engine.settings.username,
    password: engine.settings.password,
    data: formData,
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

const digestMessage = async (message: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(message) // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8) // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)) // convert buffer to byte array
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('') // convert bytes to hex string
  return hashHex
}

const encodeFileName = (baseName: string, extension: string): string => {
  // Encode both parts using Base64 and remove padding
  const encodedBaseName = btoa(baseName).replace(/=+$/, '')
  const encodedExtension = btoa(extension).replace(/=+$/, '')

  // Combine with a colon separator
  return `${encodedBaseName}:${encodedExtension}`
}

import { download, search, setURL } from '../functions'
import { SearchEngine } from '../settings'

import { Settings } from './settings'

import log from '@/services/logger/debugLogger'
import { NZBObject } from '@/services/nzbfile/nzbObject'
import { FetchOptions } from '@/utils/fetchUtilities'

type EngineWithSettings = SearchEngine & { settings: Settings }

const OPTIONS: FetchOptions = {
  responseType: 'text',
  timeout: 60000,
}

export const getNZB = async (header: string, settings: SearchEngine): Promise<NZBObject> => {
  const engine = settings as EngineWithSettings
  const options = setOptions(engine)
  const response = await search(header, options, engine)
  const results = await checkresponse(response, engine)
  const formData = makeDownloadFormData(results)
  const downloadOptions = setURL(setOptions(engine, formData), engine.settings.downloadURL)
  return await download(downloadOptions, engine)
}

const setOptions = (engine: EngineWithSettings, options: FetchOptions = {}): FetchOptions => {
  return {
    ...OPTIONS,
    ...options,
    username: engine.settings.username,
    password: engine.settings.password,
  }
}

const checkresponse = async (
  response: string,
  engine: EngineWithSettings
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
    const error = e instanceof Error ? e : new Error(String(e))
    log.warn(`error while checking the response from search engine "${engine.name}" for the NZB file ID`, error)
    throw error
  }
}

const makeDownloadFormData = (results: Array<{ [key: string]: string }>): FetchOptions => {
  const formData = new FormData()
  formData.append('autoNZB', '1')
  for (const [key, item] of Object.entries(results)) {
    formData.append(`${key}&sig=${item.sig}`, `${item[0]}|${encodeFileName(item[10], item[11])}`)
  }
  return {
    data: formData,
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

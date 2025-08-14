import jsonpath from 'jsonpath'
import { parseHTML } from 'linkedom'

import { SearchEngine } from '../settings'

import { Settings } from './settings'

import log from '@/services/logger/debugLogger'
import { NZBObject, mergeNZBObjects, textToNzbObject } from '@/services/nzbfile/nzbObject'
import { FetchOptions, useFetch } from '@/utils/fetchUtilities'

type EngineWithSettings = SearchEngine & { settings: Settings }

interface JsonResponse {
  [key: string]: unknown
}

export const getNZB = async (header: string, settings: SearchEngine): Promise<NZBObject> => {
  const engine = settings as EngineWithSettings
  const response = await search(header, engine)
  if (engine.settings.responseType === 'html') {
    return await processHtmlResponse(response, engine)
  } else if (engine.settings.responseType === 'json') {
    return await processJsonResponse(response, engine)
  } else {
    throw new Error(`Invalid response type: ${engine.settings.responseType}`)
  }
}

const search = async (header: string, engine: EngineWithSettings): Promise<string> => {
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

const processHtmlResponse = async (response: string, engine: EngineWithSettings): Promise<NZBObject> => {
  if (engine.settings.groupByPoster) {
    return await getGroupedNzbFromHtml(response, engine)
  }
  const nzbID = getItemfromHtml(response, engine.settings.searchPattern, engine.settings.searchGroup)
  if (nzbID === null) {
    throw new Error(`no NZB file ID found`)
  }
  return convertToNzbObject(await download(setOptions(nzbID, engine), engine), engine)
}

const processJsonResponse = async (response: string, engine: EngineWithSettings): Promise<NZBObject> => {
  let jsonResponse: JsonResponse
  try {
    jsonResponse = JSON.parse(response)
  } catch {
    throw new Error(`no valid JSON response`)
  }
  if (engine.settings.groupByPoster) {
    return await getGroupedNzbFromJson(jsonResponse, engine)
  }
  const nzbID = getItemfromJson(jsonResponse, engine.settings.searchPattern)
  if (nzbID === null || nzbID.length === 0) {
    throw new Error(`no NZB file ID found`)
  }
  return convertToNzbObject(await download(setOptions(nzbID[0] as string, engine), engine), engine)
}

const getItemfromHtml = (response: string, searchPattern: string, searchGroup: number): string | null => {
  try {
    const re = new RegExp(searchPattern, 'i')
    const match = response.match(re)
    if (match != null) {
      if (match[searchGroup] !== undefined) {
        return match[searchGroup]
      } else {
        log.error(`${searchGroup} is not a valid searchGroup for "${searchPattern}"`)
      }
    }
  } catch {
    log.error(`"${searchPattern}" is an invalid RegExp`)
  }
  return null
}

const getItemfromJson = (response: JsonResponse, jsonPath: string): unknown[] | null => {
  try {
    const result = jsonpath.query(response, `$.${jsonPath}`)
    return Array.isArray(result) ? result : null
  } catch {
    log.error(`${jsonPath} is not a valid JSONpath`)
  }
  return null
}

const setOptions = (nzbID: string, engine: EngineWithSettings): FetchOptions => {
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

const download = async (options: FetchOptions, engine: EngineWithSettings): Promise<string> => {
  try {
    return await (await useFetch(options)).text()
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.warn(`error while trying to download the NZB file from search engine "${engine.name}"`, error)
    throw error
  }
}

const convertToNzbObject = (nzbTextFile: string, engine: EngineWithSettings): NZBObject => {
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

const getGroupedNzbFromHtml = async (html: string, engine: EngineWithSettings): Promise<NZBObject> => {
  const results = querySelectorAll(html, engine.settings.resultSelector)
  if (results.length === 0) {
    throw new Error(`no results from search engine "${engine.name}"`)
  }
  let firstPoster: string | null = null
  const nzbs: NZBObject[] = []
  const nzbPromises: Promise<void>[] = []
  for (const result of results) {
    const nzbID = getItemfromHtml(result, engine.settings.searchPattern, engine.settings.searchGroup)
    const poster = getItemfromHtml(result, engine.settings.posterPattern, engine.settings.posterGroup)
    if (firstPoster === null) {
      firstPoster = poster
    }
    if (nzbID != null && poster != null && poster === firstPoster) {
      nzbPromises.push(makeDownloadPromise(nzbs, nzbID, engine))
    }
  }
  return downloadGroupedNZB(nzbPromises, nzbs)
}

const getGroupedNzbFromJson = async (json: JsonResponse, engine: EngineWithSettings): Promise<NZBObject> => {
  log.info(`grouping NZB files from search engine "${engine.name}"`)
  const nzbIDs = jsonpath.query(json, `$.${engine.settings.searchPattern}`)
  const posters = jsonpath.query(json, `$.${engine.settings.posterPattern}`)
  if (nzbIDs.length === 0) {
    throw new Error(`no results from search engine "${engine.name}"`)
  }
  let firstPoster: string | null = null
  const nzbs: NZBObject[] = []
  const nzbPromises: Promise<void>[] = []
  for (let i = 0; i < nzbIDs.length; i++) {
    const nzbID = nzbIDs[i] as string
    const poster = posters[i] as string
    if (firstPoster === null) {
      firstPoster = poster
    }
    if (nzbID && poster && poster === firstPoster) {
      nzbPromises.push(makeDownloadPromise(nzbs, nzbID, engine))
    }
  }
  return downloadGroupedNZB(nzbPromises, nzbs)
}

const makeDownloadPromise = (nzbs: NZBObject[], nzbID: string, engine: EngineWithSettings): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    download(setOptions(nzbID, engine), engine)
      .then((nzbTextFile) => {
        let nzbFile: NZBObject
        try {
          nzbFile = textToNzbObject(nzbTextFile)
          console.log(nzbFile)
          log.info(`the response from search engine "${engine.name}" is a valid NZB file`)
          nzbs.push(nzbFile)
          resolve()
        } catch {
          log.warn(`the response from search engine "${engine.name}" is not a valid NZB file`)
          reject(`not a valid NZB file`)
        }
      })
      .catch((error) => {
        reject(error.message || 'unknown error')
      })
  })
}

const downloadGroupedNZB = async (nzbPromises: Promise<void>[], nzbs: NZBObject[]): Promise<NZBObject> => {
  const promiseResult = await Promise.allSettled(nzbPromises)
  if (nzbs.length > 0) {
    const mergedNzb = mergeNZBObjects(nzbs)
    console.log(mergedNzb)
    return mergedNzb
  } else {
    throw new Error(promiseResult.find((result) => result.status === 'rejected')?.reason || 'unknown error')
  }
}

const querySelectorAll = (html: string, selector: string): string[] => {
  const { document } = parseHTML(html)
  const elements = document.querySelectorAll(selector)
  return Array.from(elements).map((el) => el.innerHTML || '')
}

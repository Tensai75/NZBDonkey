import jsonpath from 'jsonpath'
import { parseHTML } from 'linkedom'

import { download, search, setURL } from '../functions'
import { SearchEngine } from '../settings'

import { Settings } from './settings'

import log from '@/services/logger/debugLogger'
import { NZBObject, mergeNZBObjects } from '@/services/nzbfile/nzbObject'
import { FetchOptions } from '@/utils/fetchUtilities'

type EngineWithSettings = SearchEngine & { settings: Settings }

interface JsonResponse {
  [key: string]: unknown
}

const OPTIONS: FetchOptions = {
  responseType: 'text',
  timeout: 60000,
}

export const getNZB = async (header: string, settings: SearchEngine): Promise<NZBObject> => {
  const engine = settings as EngineWithSettings
  const response = await search(header, setURL(OPTIONS, engine.settings.searchURL, header), engine)
  if (engine.settings.responseType === 'html') {
    return await processHtmlResponse(response, engine)
  } else if (engine.settings.responseType === 'json') {
    return await processJsonResponse(response, engine)
  } else {
    throw new Error(`Invalid response type: ${engine.settings.responseType}`)
  }
}

const processHtmlResponse = async (response: string, engine: EngineWithSettings): Promise<NZBObject> => {
  if (engine.settings.groupByPoster) {
    log.info(`grouping NZB files from search engine "${engine.name}"`)
    return await getMergedNzbFromHtml(response, engine)
  }
  const nzbID = getItemfromHtml(response, engine.settings.searchPattern, engine.settings.searchGroup)
  if (nzbID === null) {
    throw new Error(`no NZB file ID found`)
  }
  return await download(setURL(OPTIONS, engine.settings.downloadURL, nzbID), engine)
}

const processJsonResponse = async (response: string, engine: EngineWithSettings): Promise<NZBObject> => {
  let jsonResponse: JsonResponse
  try {
    jsonResponse = JSON.parse(response)
  } catch {
    throw new Error(`no valid JSON response`)
  }
  if (engine.settings.groupByPoster) {
    log.info(`grouping NZB files from search engine "${engine.name}"`)
    return await getMergedNzbFromJson(jsonResponse, engine)
  }
  const nzbID = getItemfromJson(jsonResponse, engine.settings.searchPattern)
  if (nzbID === null || nzbID.length === 0) {
    throw new Error(`no NZB file ID found`)
  }
  return await download(setURL(OPTIONS, engine.settings.downloadURL, nzbID[0] as string), engine)
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

const getMergedNzbFromHtml = async (html: string, engine: EngineWithSettings): Promise<NZBObject> => {
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
  return downloadMergedNZB(nzbPromises, nzbs)
}

const getMergedNzbFromJson = async (json: JsonResponse, engine: EngineWithSettings): Promise<NZBObject> => {
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
  return downloadMergedNZB(nzbPromises, nzbs)
}

const makeDownloadPromise = (nzbs: NZBObject[], nzbID: string, engine: EngineWithSettings): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    download(setURL(OPTIONS, engine.settings.downloadURL, nzbID), engine)
      .then((nzbFile) => {
        nzbs.push(nzbFile)
        resolve()
      })
      .catch((error) => {
        reject(error.message || 'unknown error')
      })
  })
}

const downloadMergedNZB = async (nzbPromises: Promise<void>[], nzbs: NZBObject[]): Promise<NZBObject> => {
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

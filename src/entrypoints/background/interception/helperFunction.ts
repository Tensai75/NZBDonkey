import { RequestDetails } from './declarativeNetRequestHandler'

import { browser, Browser } from '#imports'
import * as interception from '@/services/interception'
import log from '@/services/logger/debugLogger'

export function prepareRequest({ body, url, method }: RequestDetails, setting: interception.DomainSettings): Request {
  let requestBody: BodyInit | null | undefined = undefined
  let contentType: string = ''
  if (body) {
    switch (setting.postDataHandling) {
      case 'sendAsFormData': {
        const formData = new FormData()
        for (const key in body) {
          for (const value of body[key]) {
            formData.append(key, value)
          }
        }
        requestBody = formData
        contentType = 'multipart/form-data'
        break
      }
      default: {
        const urlSearchParameters = new URLSearchParams()
        for (const key in body) {
          for (const value of body[key]) {
            urlSearchParameters.append(key, value)
          }
        }
        requestBody = urlSearchParameters.toString()
        contentType = 'application/x-www-form-urlencoded;charset=UTF-8'
        break
      }
    }
  }
  const headers = new Headers({ 'X-NZBBDonkey': 'true' })
  if (contentType) headers.append('Content-Type', contentType)
  return new Request(url, {
    method: method,
    body: requestBody,
    headers: headers,
  })
}

// Timeout settings for waiting loops
const step = 100
const timeout = 10000

export async function waitForTabToLoad(tabId: number): Promise<Browser.tabs.Tab> {
  let tab = await browser.tabs.get(tabId)
  if (tab.status === 'complete') return tab
  log.info(`waiting for tab ${tabId} to finish loading...`)
  let counter = 0
  while (tab.status === 'loading') {
    await new Promise((resolve) => setTimeout(resolve, step))
    // Refresh tab info
    tab = await browser.tabs.get(tabId)
    counter++
    // Calculate timeout
    if (counter >= timeout / step) {
      throw new Error(`timeout while waiting for tab ${tabId} to finish loading`)
    }
  }
  log.info(`tab ${tab.id} has finished loading after ${counter * step} ms with URL: ${tab.url}`)
  return tab
}

export function addTimestampToURL(request: Request, ruleId: number): Request {
  const url = new URL(request.url)
  // Use a combination of timestamp and counter for uniqueness
  const uniqueId = `${Date.now()}${ruleId}`
  url.searchParams.append('x-nzbdonkey', uniqueId)
  return new Request(url.toString(), request)
}

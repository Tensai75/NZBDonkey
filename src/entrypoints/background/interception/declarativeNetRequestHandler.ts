import { fetchInterceptedRequest, processInterceptedRequestResponse } from './interceptedRequestsHandler'

import { browser, Browser, i18n } from '#imports'
import * as interception from '@/services/interception'
import { updateInterceptionDomainsList } from '@/services/lists'
import log from '@/services/logger/debugLogger'
import { sendMessage } from '@/services/messengers/extensionMessenger'
import notifications from '@/services/notifications'
import {
  DeserializedResponse,
  deserializeResponse,
  getBaseDomainFromURL,
  serializeRequest,
} from '@/utils/fetchUtilities'

type RequestDetails = {
  url: string
  method: string
  body?: { [key: string]: string[] }
  source: string
}

const scriptSource: string = '/content-scripts/interception.js'

const requestCache = new Map<string, RequestDetails>()
const tabRelationships = new Map<number, number>() // key: new tab ID, value: opener tab ID

let sessionRuleId = 1

export default function (): void {
  interception.getSettings().then(async (settings) => {
    if (settings.updateOnStartup) {
      settings.domains = await updateInterceptionDomainsList(settings.domains)
      interception.saveSettings(settings)
    }
    log.info('setting up interception')
    setupInterception(settings)
    interception.watchSettings((settings) => {
      log.info('interception settings changed, updating interception setup')
      setupInterception(settings)
    })
  })
}

async function setupInterception(settings: interception.Settings): Promise<void> {
  try {
    const [activeDomains, rules] = await Promise.all([
      interception.getActiveDomains(),
      browser.declarativeNetRequest.getDynamicRules(),
    ])
    const domains = activeDomains
    const ruleIds = rules.map((rule) => rule.id)
    const urlFilterOptions = { urls: createUrlsFilter(domains) }
    log.info('updating declarativeNetRequest rules for interception')
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: constructRuleSet(domains),
    })
    if (browser.webRequest.onBeforeRequest.hasListener(onBeforeRequestListener)) {
      log.info('removing webRequest.onBeforeRequest listener for interception')
      browser.webRequest.onBeforeRequest.removeListener(onBeforeRequestListener)
    }
    if (browser.webRequest.onErrorOccurred.hasListener(onErrorOccurredListener)) {
      log.info('removing webRequest.onErrorOccurred listener for interception')
      browser.webRequest.onErrorOccurred.removeListener(onErrorOccurredListener)
    }
    if (browser.tabs.onCreated.hasListener(onTabCreatedListener)) {
      log.info('removing tabs.onCreated listener for interception')
      browser.tabs.onCreated.removeListener(onTabCreatedListener)
    }
    if (settings.enabled && activeDomains.length > 0) {
      log.info('adding webRequest.onBeforeRequest listener for interception')
      browser.webRequest.onBeforeRequest.addListener(onBeforeRequestListener, urlFilterOptions, ['requestBody'])
      log.info('adding webRequest.onErrorOccurred listener for interception')
      browser.webRequest.onErrorOccurred.addListener(onErrorOccurredListener, urlFilterOptions)
      log.info('adding tabs.onCreated listener for interception')
      browser.tabs.onCreated.addListener(onTabCreatedListener)
    }
  } catch (e) {
    log.error('failed to set up interception:', e instanceof Error ? e : new Error(String(e)))
  }
}

function onTabCreatedListener(details: Browser.tabs.Tab): void {
  if (details.id !== undefined && details.openerTabId !== undefined) {
    tabRelationships.set(details.id, details.openerTabId)
    // Clean up the relationship after 5 seconds
    setTimeout(() => {
      tabRelationships.delete(details.id!)
    }, 5000)
  }
}

function onBeforeRequestListener(
  details: Browser.webRequest.OnBeforeRequestDetails
): Browser.webRequest.BlockingResponse | undefined {
  isURLTracked(details.url).then((isTracked) => {
    if (!isTracked) return
    log.info(`request ${details.requestId} to ${details.url} is tracked, caching request details`)
    let bodyData: RequestDetails['body']
    if (details.method !== 'GET' && details.requestBody) {
      if (details.requestBody.formData) {
        bodyData = details.requestBody.formData as RequestDetails['body']
      }
    }
    requestCache.set(details.requestId, {
      url: details.url,
      method: details.method,
      body: bodyData,
      // @ts-expect-error: Property 'originUrl' does not exist on type 'WebRequestBodyDetails'
      source: details.originUrl ?? details.initiator ?? '',
    })
    setTimeout(() => {
      if (requestCache.delete(details.requestId)) {
        log.info(`request cache for request ${details.requestId} was cleared after 5 seconds`)
      }
    }, 5000)
  })
  return undefined
}

function onErrorOccurredListener(details: Browser.webRequest.WebRequestDetails): void {
  isURLTracked(details.url).then(async (isTracked) => {
    let sourceUrl = ''
    let tabId: number = details.tabId
    try {
      if (!isTracked) return
      notifications.info(i18n.t('interception.requestBlocked', [details.url]))
      log.info(`request ${details.requestId} to ${details.url} was blocked by interception rules`)
      if (tabRelationships.has(details.tabId)) {
        // If the tab was opened from another tab, close it
        log.info(`closing tab ${tabId} opened from tab ${tabRelationships.get(tabId)}`)
        await browser.tabs.remove(tabId)
        // set tabId to the opener tab for further processing
        tabId = tabRelationships.get(tabId)!
        tabRelationships.delete(details.tabId)
      } else if (tabId >= 0 && details.frameId === 0 && details.type === 'main_frame') {
        // If it's a main frame request, try to go back
        log.info(`updating tab ${tabId} due to blocked request`)
        await goBack(tabId, details.url)
      }
      const cachedRequest = requestCache.get(details.requestId)
      if (!cachedRequest) throw new Error(`no cached request found for requestId ${details.requestId}`)
      requestCache.delete(details.requestId) // Clear the cache after processing
      const { url } = cachedRequest
      const domain = getBaseDomainFromURL(url)
      const setting = (await interception.getSettings()).domains.find((d) => d.domain === domain)
      if (!setting) throw new Error(`no domain setting found for ${domain}`)
      // Try to reach tab and inject script to get the source URL
      let error = true
      let counter = 0
      while (error) {
        try {
          const [scriptingResult] = await browser.scripting.executeScript({
            target: { tabId: tabId },
            func: () => window.location.href,
          })
          sourceUrl = scriptingResult.result as string
          log.info(`source URL for request ${details.requestId} is ${sourceUrl}`)
          error = false
        } catch {
          // Ignore errors and retry
        } finally {
          counter++
          await new Promise((resolve) => setTimeout(resolve, 200))
          // Timeout after 5 seconds (25 * 200ms)
          if (counter >= 25) {
            // eslint-disable-next-line no-unsafe-finally
            throw new Error(`timeout while waiting for tab ${tabId} to be loaded for source URL retrieval`)
          }
        }
      }
      const request = prepareRequest(cachedRequest, setting)
      let response: Response | DeserializedResponse
      switch (setting.fetchOrigin) {
        case 'injection': {
          response = await fetchFromContentScript(request, domain, tabId)
          break
        }
        default:
          response = await fetchInterceptedRequest(request)
      }
      processInterceptedRequestResponse({ response, source: sourceUrl })
    } catch (e) {
      const url = details.url
      const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
      log.error(`faild to intercept request ${details.requestId} from ${url}`, error)
      notifications.error(i18n.t('interception.fetchError', [url, sourceUrl, error.message]))
      await browser.scripting.executeScript({
        target: { tabId: tabId },
        func: (msg: string) => alert(msg),
        args: [error.toString()],
      })
    }
  })
}

function constructRuleSet(activeDomains: interception.DomainSettings[]): Browser.declarativeNetRequest.Rule[] {
  return activeDomains.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: 'block' },
    condition: {
      regexFilter: `${domain.domain}${normalizeRegexStart(domain.pathRegExp)}`,
      resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script', 'other'],
      requestMethods: ['get', 'post'],
      initiatorDomains: [domain.domain],
    },
  }))
}

function createUrlsFilter(activeDomains: interception.DomainSettings[]): string[] {
  return activeDomains.filter((domainObj) => !!domainObj.domain).map((domainObj) => `*://*.${domainObj.domain}/*`)
}

async function isURLTracked(url: string): Promise<boolean> {
  const activeDomains = await interception.getActiveDomains()
  for (const domain of activeDomains) {
    try {
      const regex = new RegExp(`${domain.domain}${normalizeRegexStart(domain.pathRegExp)}`, 'i')
      if (regex.test(url)) return true
    } catch (e) {
      log.error(
        `invalid regex for domain ${domain.domain}: ${domain.pathRegExp}`,
        e instanceof Error ? e : new Error(String(e))
      )
    }
  }
  return false
}

async function goBack(tabId: number, url: string): Promise<void> {
  try {
    const tab = await browser.tabs.get(tabId)
    if (!tab) throw new Error('tab is not defined')
    // If the current URL matches the intercepted URL, simply go back.
    // This is the usual case for most sites.
    if (tab.url && tab.url.startsWith(url)) {
      await browser.tabs.goBack(tabId)
      log.info(`successfully went back in tab ${tabId}`)
      return
    }
    // On some sites, e.g. drunkenslug, the tab still shows the initiator URL
    // so in this case we need to reload the tab with this URL to go back.
    if (tab.url && !tab.url.startsWith(url)) {
      await browser.tabs.update(tabId, { url: tab.url })
      log.info(`successfully reloaded tab ${tabId}`)
      return
    }
  } catch (e) {
    if (String(e).includes('Cannot find a next page in history')) {
      // Close the tab if going back is not possible
      try {
        await browser.tabs.remove(tabId)
      } catch {
        // ignore errors
      }
    } else {
      log.error(`failed to update tab ${tabId}: ${String(e)}`, e instanceof Error ? e : new Error(String(e)))
    }
  }
}

function normalizeRegexStart(input: string): string {
  return input.startsWith('^') ? input.slice(1) : '.*?' + input
}

function prepareRequest({ body, url, method }: RequestDetails, setting: interception.DomainSettings): Request {
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

async function fetchFromContentScript(request: Request, domain: string, tabId: number): Promise<DeserializedResponse> {
  const ruleId = sessionRuleId++
  try {
    // add session rule to allow the request for exact this url
    log.info(`adding session rule no ${ruleId} for ${request.url}`)
    browser.declarativeNetRequest.updateSessionRules({
      addRules: [
        {
          id: ruleId,
          priority: 1,
          action: { type: 'allow' },
          condition: {
            urlFilter: request.url,
            resourceTypes: ['xmlhttprequest', 'script', 'other'],
            initiatorDomains: [domain],
          },
        },
      ],
    })
    // inject the fetch script into the tab
    log.info(`injecting interception content script for ${request.url} into tab ${tabId}`)
    await browser.scripting.executeScript({
      target: { tabId: tabId },
      files: [scriptSource],
      injectImmediately: true,
    })
    // send the fetch request to the content script and wait for the response
    log.info(`forwarding intercepted request to interception content script for ${request.url}`)
    const serializedRequest = await serializeRequest(request)
    const serializedResponse = await sendMessage('fetchRequest', serializedRequest, tabId)
    if (serializedResponse instanceof Error) {
      log.error(`error received from interception content script for ${request.url}`, serializedResponse)
      throw serializedResponse
    } else {
      log.info(`response received from interception content script for ${request.url}`)
      return deserializeResponse(serializedResponse)
    }
  } finally {
    // remove the session rule after processing the request
    log.info(`removing session rule no ${ruleId} for ${request.url}`)
    await browser.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] })
  }
}

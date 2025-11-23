import { interceptRequest } from './interceptRequestsHandler'

import { browser, Browser } from '#imports'
import * as interception from '@/services/interception'
import { updateInterceptionDomainsList } from '@/services/lists'
import log from '@/services/logger/debugLogger'

export type RequestDetails = {
  tabId: number
  requestId: string
  url: string
  method: string
  body?: { [key: string]: string[] }
  source: string
}

// Redirect URLs to be used in declarativeNetRequest rule
// User selectable option to be implemented maybe in future versions
/*
const redirectURLs = [
  'https://cp.cloudflare.com/generate_204',
  'https://www.gstatic.com/generate_204',
  'https://connectivity-check.ubuntu.com/204',
  'https://httpstat.us/204',
  'https://httpbin.org/status/204',
  'https://www.google.com/generate_204',
]
*/
// Redirect URL to be used in declarativeNetRequest rule
const redirectURL: string = 'https://connectivity-check.ubuntu.com'
// In-memory cache for request details
export const requestCache = new Map<string, RequestDetails>()
export const tabRelationships = new Map<number, number>() // key: new tab ID, value: opener tab ID

// Request methods for declarativeNetRequest rules
const requestMethods: ('other' | 'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put')[] = [
  'other',
  'connect',
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
]
// Resource types for declarativeNetRequest rules
const resourceTypes: (
  | 'object'
  | 'main_frame'
  | 'sub_frame'
  | 'stylesheet'
  | 'script'
  | 'image'
  | 'font'
  | 'xmlhttprequest'
  | 'ping'
  | 'csp_report'
  | 'media'
  | 'websocket'
  | 'other'
)[] = [
  'object',
  'main_frame',
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'xmlhttprequest',
  'ping',
  'csp_report',
  'media',
  'websocket',
  'other',
]

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
      log.info('removing onBeforeRequest listener for interception')
      browser.webRequest.onBeforeRequest.removeListener(onBeforeRequestListener)
    }
    if (browser.webRequest.onHeadersReceived.hasListener(onRedirectHeadersReceivedListener)) {
      log.info('removing onRedirectHeadersReceived listener for interception')
      browser.webRequest.onHeadersReceived.removeListener(onRedirectHeadersReceivedListener)
    }
    if (browser.tabs.onCreated.hasListener(onTabCreatedListener)) {
      log.info('removing onTabCreated listener for interception')
      browser.tabs.onCreated.removeListener(onTabCreatedListener)
    }
    if (settings.enabled && activeDomains.length > 0) {
      log.info('adding onBeforeRequest listener for interception')
      browser.webRequest.onBeforeRequest.addListener(onBeforeRequestListener, urlFilterOptions, ['requestBody'])
      log.info('adding onRedirectHeadersReceived listener for interception')
      browser.webRequest.onHeadersReceived.addListener(onRedirectHeadersReceivedListener, {
        urls: [redirectURL + '/*'],
      })
      log.info('adding onTabCreated listener for interception')
      browser.tabs.onCreated.addListener(onTabCreatedListener)
    }
  } catch (e) {
    log.error('failed to set up interception:', e instanceof Error ? e : new Error(String(e)))
  }
}

function onTabCreatedListener(details: Browser.tabs.Tab): void {
  if (details.id !== undefined && details.openerTabId !== undefined) {
    tabRelationships.set(details.id, details.openerTabId)
    setTimeout(() => {
      if (tabRelationships.delete(details.id!)) {
        log.info(`tab relationship for tab ${details.id} was cleared after 5 seconds`)
      }
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
      tabId: details.tabId,
      requestId: details.requestId,
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

function onRedirectHeadersReceivedListener(
  details: Browser.webRequest.OnHeadersReceivedDetails
): Browser.webRequest.BlockingResponse | undefined {
  const process = async () => {
    log.info(`interception redirect detected for request ${details.requestId} to ${details.url}`)
    // Wait for the request details to be available in the cache
    // This is necessary because onBeforeRedirectRequestListener is called
    // before onBeforeRequestListener has finished caching the details
    let timeout = false
    setTimeout(() => {
      timeout = true
    }, 1000)
    while (!requestCache.has(details.requestId)) {
      log.info(`waiting for cached request details of ${details.requestId}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (timeout) {
        log.warn(`waiting for request details of ${details.requestId} timed out, skipping interception`)
        return
      }
    }
    // Once the request details are available or the timeout is reached,
    // either process the request if found in cache or ignore it
    if (requestCache.has(details.requestId)) {
      log.info(`intercepted request ${details.requestId} found in cache`)
      interceptRequest(requestCache.get(details.requestId)!)
      requestCache.delete(details.requestId)
    }
  }
  process()
  return undefined
}

function constructRuleSet(activeDomains: interception.DomainSettings[]): Browser.declarativeNetRequest.Rule[] {
  // Create redirect rules for each active domain
  const ruleSet: Browser.declarativeNetRequest.Rule[] = activeDomains.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: 'redirect', redirect: { url: redirectURL } },
    condition: {
      regexFilter: `${domain.domain}${normalizeRegexStart(domain.pathRegExp)}`,
      resourceTypes,
      requestMethods,
      initiatorDomains: [domain.domain],
    },
  }))
  // Add header modification rule to remove cookies and referer for redirected requests
  const requestHeaderRule: Browser.declarativeNetRequest.Rule = {
    id: ruleSet.length + 1,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        { header: 'cookie', operation: 'remove' },
        { header: 'referer', operation: 'remove' },
        { header: 'origin', operation: 'remove' },
        { header: 'user-agent', operation: 'remove' },
      ],
    },
    condition: {
      regexFilter: redirectURL,
      resourceTypes,
      requestMethods,
    },
  }
  ruleSet.push(requestHeaderRule)
  return ruleSet
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

function normalizeRegexStart(input: string): string {
  return input.startsWith('^') ? input.slice(1) : '.*?' + input
}

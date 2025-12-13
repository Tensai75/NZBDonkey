import { interceptRequest } from './interceptedRequestsHandler'

import { browser, Browser } from '#imports'
import { DomainSettings, getActiveDomains, watchSettings as watchInterceptionSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import { onMessage } from '@/services/messengers/extensionMessenger'

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
const redirectURL: string = 'https://connectivity-check.ubuntu.com/204'
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
  setupInterception() // <- async setup
  // synchronous listener for heartbeat messages
  registerHeartbeatListener()
  // synchronous listener for settings changes
  watchInterceptionSettings(async () => {
    log.info('interception settings have changed, updating declarativeNetRequest rules and listeners')
    await updateDeclarativeNetRequest()
    await registerInterceptionListener()
  })
}

async function setupInterception(): Promise<void> {
  log.info('setting up declarativeNetRequest rules and listeners for interception')
  await updateDeclarativeNetRequest()
  await registerInterceptionListener()
}

async function updateDeclarativeNetRequest(): Promise<void> {
  try {
    const [activeDomains, rules] = await Promise.all([
      getActiveDomains(),
      browser.declarativeNetRequest.getDynamicRules(),
    ])
    const ruleIds = rules.map((rule) => rule.id)
    log.info('updating declarativeNetRequest rules for interception')
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: constructRuleSet(activeDomains),
    })
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('failed to update declarativeNetRequest for interception:', error)
  }
}

// Interception listeners are registered asynchronously after fetching the settings.
// The heartbeat messages from the content secript will keep the background script alive
// to ensure the interception listeners work reliably.
async function registerInterceptionListener(): Promise<void> {
  const urlsFilter = await createUrlsFilter()

  // Remove existing listeners
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

  // If none of the domains are active, skip listener registration
  if (urlsFilter.length === 0) {
    log.info('no active interception domains found, skipping listener registration')
    return
  }

  // Add listener for interception
  try {
    log.info('registering onBeforeRequest listener for interception')
    browser.webRequest.onBeforeRequest.addListener(onBeforeRequestListener, { urls: urlsFilter }, ['requestBody'])
    log.info('registration of the onBeforeRequest listener for interception was successful')
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('failed to register onBeforeRequest listener for interception:', error)
  }
  try {
    log.info('registering onRedirectHeadersReceived listener for interception')
    browser.webRequest.onHeadersReceived.addListener(onRedirectHeadersReceivedListener, { urls: [redirectURL] })
    log.info('registration of the onRedirectHeadersReceived listener for interception was successful')
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('failed to register onRedirectHeadersReceived listener for interception:', error)
  }
  try {
    log.info('registering onTabCreated listener for interception')
    browser.tabs.onCreated.addListener(onTabCreatedListener)
    log.info('registration of the onTabCreated listener for interception was successful')
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('failed to register onTabCreated listener for interception:', error)
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
  ;(async () => {
    log.info(`interception redirect detected for request ${details.requestId}`)
    // Wait for the request details to be available in the cache.
    // This is necessary because onBeforeRedirectRequestListener may be called
    // before onBeforeRequestListener has finished caching the details.
    let timeout = false
    setTimeout(() => {
      timeout = true
    }, 1000)
    while (!requestCache.has(details.requestId)) {
      log.info(`waiting for cached request details of request ${details.requestId}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (timeout) {
        log.warn(`waiting for request details of request ${details.requestId} timed out, skipping interception`)
        return
      }
    }
    // Once the request details are available or the timeout is reached,
    // either process the request if found in cache or ignore it
    if (requestCache.has(details.requestId)) {
      log.info(`request details of intercepted request ${details.requestId} found in cache`)
      interceptRequest(requestCache.get(details.requestId)!)
      requestCache.delete(details.requestId)
    }
  })()
  return undefined
}

function registerHeartbeatListener(): void {
  onMessage('heartbeat', async () => {
    log.info('heartbeat message received from content script')
  })
}

function constructRuleSet(activeDomains: DomainSettings[]): Browser.declarativeNetRequest.Rule[] {
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

async function createUrlsFilter(): Promise<string[]> {
  const activeDomains = await getActiveDomains()
  return activeDomains.filter((domainObj) => !!domainObj.domain).map((domainObj) => `*://*.${domainObj.domain}/*`)
}

async function isURLTracked(url: string): Promise<boolean> {
  const activeDomains = await getActiveDomains()
  for (const domain of activeDomains) {
    try {
      const regex = new RegExp(`${domain.domain}${normalizeRegexStart(domain.pathRegExp)}`, 'i')
      if (regex.test(url)) return true
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      log.error(`invalid regex for domain ${domain.domain}: ${domain.pathRegExp}`, error)
    }
  }
  return false
}

function normalizeRegexStart(input: string): string {
  return input.startsWith('^') ? input.slice(1) : '.*?' + input
}

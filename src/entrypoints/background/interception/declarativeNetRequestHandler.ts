import { interceptRequest } from './interceptedRequestsHandler'

import { browser, Browser, i18n } from '#imports'
import { DomainSettings, getActiveDomains, watchSettings as watchInterceptionSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import { onMessage } from '@/services/messengers/extensionMessenger'
import notifications from '@/services/notifications'

export type RequestDetails = {
  tabId: number
  requestId: string
  url: string
  method: string
  body?: { [key: string]: string[] }
  source: string
}

const prefetchRequests = new Set<string>() // to track prefetch requests and avoid intercepting them in onBeforeRequestListener

// Redirect URLs to be used in declarativeNetRequest rule
const redirectURLs = [
  'https://httpbin.org/status/204', // works
  'https://cp.cloudflare.com/generate_204', // CORS error but should work
  'https://www.gstatic.com/generate_204', // CORS error but should work
  'https://connectivity-check.ubuntu.com/204', // CORS error but should work
  'https://www.google.com/generate_204', // CORS error but should work
  //'https://httpstat.us/204', // https gives a cert error
]

// Redirect URL to be used in declarativeNetRequest rule - determined at runtime by racing all URLs
let redirectURL: string = redirectURLs[0]
// In-memory cache for request details
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
    await registerDeclarativeNetRequestInterceptionListener()
  })
}

async function setupInterception(): Promise<void> {
  log.info('setting up declarativeNetRequest rules and listeners for declarativeNetRequest interception')
  redirectURL = await getRedirectURL()
  await updateDeclarativeNetRequest()
  await registerDeclarativeNetRequestInterceptionListener()
}

async function getRedirectURL(): Promise<string> {
  for (const url of redirectURLs) {
    try {
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      if (response.ok || response.status === 204) {
        log.info(`redirect URL determined: ${url}`)
        return url
      }
      log.info(`${url} responded with status ${response.status}, trying next`)
    } catch {
      log.info(`${url} did not respond, trying next`)
    }
  }
  log.error(`no redirect URL responded successfully, using default: ${redirectURLs[0]}`)
  notifications.error(i18n.t('interception.noRedirectURLAvailable'))
  return redirectURLs[0]
}

async function updateDeclarativeNetRequest(): Promise<void> {
  try {
    const [activeDomains, rules] = await Promise.all([
      getActiveDomains(),
      browser.declarativeNetRequest.getDynamicRules(),
    ])
    const ruleIds = rules.map((rule) => rule.id)
    log.info('updating declarativeNetRequest rules for declarativeNetRequest interception')
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: constructRuleSet(activeDomains),
    })
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('failed to update declarativeNetRequest for declarativeNetRequest interception:', error)
  }
}

// DeclarativeNetRequest interception listeners are registered asynchronously after fetching the settings.
// The heartbeat messages from the content script will keep the background script alive
// to ensure the interception listeners work reliably.
async function registerDeclarativeNetRequestInterceptionListener(): Promise<void> {
  const urlsFilter = await createUrlsFilter()

  // Remove existing listeners
  if (browser.webRequest.onBeforeRequest.hasListener(onBeforeRequestListener)) {
    log.info('removing onBeforeRequest listener for declarativeNetRequest interception')
    browser.webRequest.onBeforeRequest.removeListener(onBeforeRequestListener)
  }
  if (browser.tabs.onCreated.hasListener(onTabCreatedListener)) {
    log.info('removing onTabCreated listener for declarativeNetRequest interception')
    browser.tabs.onCreated.removeListener(onTabCreatedListener)
  }
  if (browser.webRequest.onBeforeSendHeaders.hasListener(onBeforeSendHeadersListener)) {
    log.info('removing onBeforeSendHeaders listener for declarativeNetRequest interception')
    browser.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersListener)
  }

  // If none of the domains are active, skip listener registration
  if (urlsFilter.length === 0) {
    log.info('no active declarativeNetRequest interception domains found, skipping listener registration')
    return
  }

  // Add listener for interception
  try {
    log.info('registering onBeforeRequest listener for interception')
    browser.webRequest.onBeforeRequest.addListener(onBeforeRequestListener, { urls: urlsFilter }, ['requestBody'])
    log.info('registration of the onBeforeRequest listener for declarativeNetRequest interception was successful')
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('failed to register onBeforeRequest listener for declarativeNetRequest interception:', error)
  }
  try {
    log.info('registering onTabCreated listener for interception')
    browser.tabs.onCreated.addListener(onTabCreatedListener)
    log.info('registration of the onTabCreated listener for declarativeNetRequest interception was successful')
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('failed to register onTabCreated listener for declarativeNetRequest interception:', error)
  }
  try {
    log.info('registering onBeforeSendHeaders listener for interception')
    browser.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeadersListener, { urls: urlsFilter }, [
      'requestHeaders',
      'extraHeaders',
    ])
    log.info('registration of the onBeforeSendHeaders listener for declarativeNetRequest interception was successful')
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('failed to register onBeforeSendHeaders listener for declarativeNetRequest interception:', error)
  }
}

function onBeforeSendHeadersListener(
  details: Browser.webRequest.OnBeforeSendHeadersDetails
): Browser.webRequest.BlockingResponse | undefined {
  isURLTracked(details.url).then((isTracked) => {
    // If the tabId is negative, it means the request comes from the background script itself and hence should be ignored
    if (!isTracked || details.tabId < 0) return
    details.requestHeaders?.forEach((header) => {
      if (header.name.toLowerCase() === 'sec-purpose' && header.value?.toLowerCase() === 'prefetch') {
        prefetchRequests.add(details.requestId)
        log.info(
          `request ${details.requestId} to ${details.url} is identified as a prefetch request, it will be ignored in onBeforeRequestListener`
        )
      }
    })
  })
  return undefined
}

function onTabCreatedListener(details: Browser.tabs.Tab): void {
  if (details.id !== undefined && details.openerTabId !== undefined) {
    tabRelationships.set(details.id, details.openerTabId)
    setTimeout(() => {
      if (tabRelationships.delete(details.id!)) {
        log.info(`tab relationship for tab ${details.id} was cleared after 500 ms`)
      }
    }, 500)
  }
}

function onBeforeRequestListener(
  details: Browser.webRequest.OnBeforeRequestDetails
): Browser.webRequest.BlockingResponse | undefined {
  isURLTracked(details.url).then((isTracked) => {
    // If the tabId is negative, it means the request comes from the background script itself and hence should be ignored
    if (!isTracked || details.tabId < 0) return
    setTimeout(() => {
      // ensure this runs after the onBeforeSendHeadersListener
      if (prefetchRequests.has(details.requestId)) {
        log.info(`request ${details.requestId} to ${details.url} is a prefetch request, ignoring it`)
        prefetchRequests.delete(details.requestId)
        return
      }
      log.info(`request ${details.requestId} to ${details.url} is going to be blocked, gathering request details`)
      let bodyData: RequestDetails['body']
      if (details.method !== 'GET' && details.requestBody) {
        if (details.requestBody.formData) {
          bodyData = details.requestBody.formData as RequestDetails['body']
        }
      }
      const requestDeatils = {
        tabId: details.tabId,
        requestId: details.requestId,
        url: details.url,
        method: details.method,
        body: bodyData,
        // @ts-expect-error: Property 'originUrl' does not exist on type 'WebRequestBodyDetails'
        source: details.originUrl ?? details.initiator ?? '',
      }
      interceptRequest(requestDeatils)
    }, 250)
  })
  return undefined
}

function registerHeartbeatListener(): void {
  onMessage('heartbeat', async (details) => {
    log.info('heartbeat message received from content script')
    // Remove tabId from tab relationship if exists
    const tab = details.sender.tab.id
    if (tabRelationships.delete(tab)) {
      log.info(`tab relationship for tab ${tab} was cleared`)
    }
  })
}

function constructRuleSet(activeDomains: DomainSettings[]): Browser.declarativeNetRequest.Rule[] {
  // Create redirect rules for each active domain
  const ruleSet: Browser.declarativeNetRequest.Rule[] = activeDomains
    .filter((domain) => !!domain.domain && domain.interceptionMethod === 'declarativeNetRequest')
    .map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: { type: 'redirect', redirect: { url: redirectURL } },
      condition: {
        regexFilter: getDomainRegExp(domain),
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
  return activeDomains
    .filter((domainObj) => !!domainObj.domain && domainObj.interceptionMethod === 'declarativeNetRequest')
    .map((domainObj) => `*://*.${domainObj.domain}/*`)
}

async function isURLTracked(url: string): Promise<boolean> {
  if (url.includes('x-nzbdonkey')) return false // avoid intercepting our own requests from the content script
  const activeDomains = await getActiveDomains()
  for (const domain of activeDomains) {
    try {
      const regex = new RegExp(getDomainRegExp(domain), 'i')
      if (regex.test(url)) return true
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      log.error(`invalid regex for domain ${domain.domain}: ${domain.pathRegExp}`, error)
    }
  }
  return false
}

function getDomainRegExp(domain: DomainSettings): string {
  const pathRegExp = domain.pathRegExp.startsWith('^') ? domain.pathRegExp.slice(1) : '.*?' + domain.pathRegExp
  return `${domain.domain}${pathRegExp}`
}

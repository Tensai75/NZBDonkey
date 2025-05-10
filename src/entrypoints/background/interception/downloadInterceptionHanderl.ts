import { fetchInterceptedRequest } from './interceptedRequestsHandler'

import { browser, Browser } from '#imports'
import * as interception from '@/services/interception'
import log from '@/services/logger/debugLogger'
import { onMessage, sendMessage } from '@/services/messengers/extensionMessenger'
import { InterceptionRequest } from '@/services/messengers/windowMessenger'
import { getRelativeURL } from '@/utils/fetchUtilities'

// Extend the Window interface to include the custom property
declare global {
  interface Window {
    __NZBDONKEY_DOUBLECOUNTWARNING_SCRIPT_INJECTED__?: boolean
    __TAB_ID__?: number
  }
}

const doubleCountWarningScriptSource: string = '/content-scripts/doublecountwarning.js'

const requestDetailsMap = new Map<string, { formData?: string; tabId?: number; source: string }>()

export default async function (): Promise<void> {
  addListener()
  interception.watchSettings(async (settings) => {
    if (settings.enabled) {
      removeListener()
      addListener()
    } else {
      removeListener()
    }
  })
  onMessage('doubleCountWarningResponse', async (message) => {
    log.info('received domain settings from the double count warning script')
    const settings = await interception.getSettings()
    const index = settings.domains.findIndex((domain) => domain.domain === message.data.domain.domain)
    if (index !== -1) {
      settings.domains[index] = message.data.domain
      interception.saveSettings(settings)
    }
  })
}

async function addListener(): Promise<void> {
  log.info('adding download interception listeners')
  try {
    browser.webRequest.onBeforeRequest.addListener(webrequestOnBeforeRequestListerner, { urls: ['<all_urls>'] }, [
      'requestBody',
    ])
    browser.downloads.onCreated.addListener(downloadsOnCreatedListener)
    log.info('download interception listeners added successfully')
  } catch (e) {
    log.error('failed to add download interception listeners:', e instanceof Error ? e : new Error(String(e)))
  }
}

function removeListener(): void {
  log.info('removing download interception listeners')
  try {
    if (browser.webRequest.onBeforeRequest.hasListener(webrequestOnBeforeRequestListerner)) {
      browser.webRequest.onBeforeRequest.removeListener(webrequestOnBeforeRequestListerner)
    }
    if (browser.downloads.onCreated.hasListener(downloadsOnCreatedListener)) {
      browser.downloads.onCreated.removeListener(downloadsOnCreatedListener)
    }
    log.info('download interception listeners removed sucesssfully')
  } catch (e) {
    log.error('failed to remove download interception listeners:', e instanceof Error ? e : new Error(String(e)))
  }
}

function webrequestOnBeforeRequestListerner(details: Browser.webRequest.WebRequestBodyDetails): void {
  interception.getSettings().then(async (settings) => {
    if (!settings.enabled || !isURLTracked(details.url)) return
    if (details.method === 'POST' && details.requestBody) {
      const formData = details.requestBody.formData
        ? Object.entries(details.requestBody.formData)
            .map(([key, value]) => `${key}=${value}`)
            .join('&')
        : undefined
      // @ts-expect-error: Property 'originUrl' does not exist on type 'WebRequestBodyDetails'
      requestDetailsMap.set(details.url, { formData, tabId: details.tabId, source: details.originUrl ?? '' })
    } else {
      // @ts-expect-error: Property 'originUrl' does not exist on type 'WebRequestBodyDetails'
      requestDetailsMap.set(details.url, { tabId: details.tabId, source: details.originUrl ?? '' })
    }
  })
}

function downloadsOnCreatedListener(downloadItem: Browser.downloads.DownloadItem) {
  interception.getActiveDomains().then(async (activeDomains) => {
    const finalUrl = import.meta.env.CHROME ? downloadItem.finalUrl : downloadItem.url
    const currentDomain = activeDomains.find((domain) => finalUrl.includes(domain.domain))
    const originalRequest = requestDetailsMap.get(finalUrl)
    if (!currentDomain || finalUrl.match(currentDomain.pathRegExp) === null) return
    if (!currentDomain.allowDownloadInterception) {
      log.info(`download interception not allowed for domain ${currentDomain.domain}`)
      if (!currentDomain.dontShowDoubleCountWarning) {
        log.info('showing double count warning')
        showDoubleCountWarning(currentDomain, originalRequest?.tabId ?? -1)
      }
      return
    }
    log.info(`intercepting download for URL: ${finalUrl}`)
    try {
      await browser.downloads.cancel(downloadItem.id)
    } catch (e) {
      log.error('failed to cancel download:', e instanceof Error ? e : new Error(String(e)))
    }
    if (!currentDomain.dontShowDoubleCountWarning) {
      log.info('showing double count warning')
      showDoubleCountWarning(currentDomain, originalRequest?.tabId ?? -1)
    }
    const interceptionRequest: InterceptionRequest = {
      url: finalUrl,
      source: (originalRequest?.source != '' ? originalRequest?.source : downloadItem.url) as string,
      domain: new URL(finalUrl).hostname,
      options: { credentials: 'include' } as RequestInit,
      formData: originalRequest?.formData ?? '',
      searchParams: '',
    }
    // handle the download request
    fetchInterceptedRequest(interceptionRequest)
  })
}

async function isURLTracked(url: string, domains?: interception.DomainSettings[]): Promise<boolean> {
  const path = url.startsWith('/') ? url : getRelativeURL(url)
  for (const { domain, pathRegExp } of domains ?? (await interception.getActiveDomains())) {
    try {
      const regex = new RegExp(pathRegExp, 'i') // Convert string to RegExp
      if (regex.test(path)) {
        return true // Return true if the URL matches any regex
      }
    } catch (e) {
      log.error(`invalid regex for domain ${domain}: ${pathRegExp}`, e instanceof Error ? e : new Error(String(e)))
    }
  }
  return false // Return false if no match is found
}

async function showDoubleCountWarning(domain: interception.DomainSettings, tabId: number): Promise<void> {
  try {
    // Check if the script is already injected
    const [result] = await browser.scripting.executeScript({
      target: { tabId: tabId },
      func: () => !!window.__NZBDONKEY_DOUBLECOUNTWARNING_SCRIPT_INJECTED__,
    })
    // If the script is not injected, inject it
    if (!result?.result) {
      // Set a marker to indicate the script is injected
      await browser.scripting.executeScript({
        target: { tabId: tabId },
        func: (tabId) => {
          window.__NZBDONKEY_DOUBLECOUNTWARNING_SCRIPT_INJECTED__ = true
          window.__TAB_ID__ = tabId
        },
        args: [tabId],
      })
      // Inject the script
      await browser.scripting.executeScript({
        target: { tabId: tabId },
        files: [doubleCountWarningScriptSource],
      })
      log.info(`double count warning script injected successfully into tab ${tabId}.`)
      sendMessage('doubleCountWarning', { tabId: tabId, domain }, tabId)
    } else {
      sendMessage('doubleCountWarning', { tabId: tabId, domain }, tabId)
      log.info(`double count warning script already injected into tab ${tabId}.`)
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`error injecting selection script into tab ${tabId}:`, error)
  }
}

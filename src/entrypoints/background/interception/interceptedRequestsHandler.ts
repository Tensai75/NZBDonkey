import { RequestDetails, tabRelationships } from './declarativeNetRequestHandler'
import { addTimestampToURL, prepareRequest, waitForTabToLoad } from './helperFunction'

import { i18n } from '#imports'
import {
  getSettings as getInterceptionSettings,
  handleError,
  handleNzbDialogIfNeeded,
  handleResponseData,
  processNzbFiles,
} from '@/services/interception'
import log from '@/services/logger/debugLogger'
import { sendMessage } from '@/services/messengers/extensionMessenger'
import notifications from '@/services/notifications'
import { NZBFileObject } from '@/services/nzbfile'
import {
  DeserializedResponse,
  deserializeResponse,
  getBaseDomainFromURL,
  getFilenameFromResponse,
  getHttpStatusText,
  serializeRequest,
} from '@/utils/fetchUtilities'

// Session rule ID counter
let sessionRuleId = 1

export async function interceptRequest(details: RequestDetails): Promise<void> {
  const url = details.url
  let sourceUrl = details.source
  let tabId: number = details.tabId
  try {
    // Inform the user that the request was blocked
    notifications.info(i18n.t('interception.requestBlocked', [url]))
    log.info(`request ${details.requestId} to ${url} was blocked by interception rules`)
    // Check if the tab was opened from another tab
    if (tabRelationships.has(details.tabId)) {
      // If the tab was opened from another tab, close it
      log.info(`closing tab ${tabId} opened from tab ${tabRelationships.get(tabId)}`)
      await browser.tabs.remove(tabId)
      // set tabId to the opener tab for further processing
      tabId = tabRelationships.get(tabId)!
      tabRelationships.delete(details.tabId) // Clean up the relationship
    }
    // Get the domain settings
    const domain = getBaseDomainFromURL(url)
    const setting = (await getInterceptionSettings()).domains.find((d) => d.domain === domain)
    if (!setting) throw new Error(`no domain setting found for ${domain}`)
    // Wait for the tab to be loaded completely
    await waitForTabToLoad(tabId)
    // Inject a script to get the source URL
    try {
      const [scriptingResult] = await browser.scripting.executeScript({
        target: { tabId: tabId },
        // @ts-expect-error "Type '() => string' is not assignable to type '() => void | undefined'."
        func: () => {
          return window.location.href
        },
        injectImmediately: true,
      })
      sourceUrl = scriptingResult.result as string
    } catch (e) {
      // If injection fails, fall back to the source from the request details
      log.error(
        `failed to get source URL for request ${details.requestId}`,
        e instanceof Error ? e : new Error(String(e))
      )
    }
    log.info(`source URL for request ${details.requestId} is ${sourceUrl}`)
    // Prepare the request
    const request = prepareRequest(details, setting)
    let response: Response | DeserializedResponse
    // Fetch the request based on the fetch origin setting
    switch (setting.fetchOrigin) {
      case 'injection': {
        response = await fetchInterceptedRequestFromContentScript(request, domain, tabId)
        break
      }
      default:
        response = await fetchInterceptedRequest(request)
    }
    // Process the response
    processInterceptedRequestResponse({ response, source: sourceUrl })
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`faild to intercept request ${details.requestId} from ${url}`, error)
    notifications.error(i18n.t('interception.fetchError', [url, sourceUrl, error.message]))
  }
}

export async function fetchInterceptedRequest(request: Request): Promise<Response> {
  try {
    log.info(`fetching intercepted request from ${request.url}`)
    const response = await fetch(request)
    if (!response.ok) {
      throw new Error(`${response.status} - ${getHttpStatusText(response.status)}`)
    }
    return response
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('error fetching intercepted request', error)
    throw error
  }
}

export async function fetchInterceptedRequestFromContentScript(
  request: Request,
  domain: string,
  tabId: number
): Promise<DeserializedResponse> {
  const ruleId = sessionRuleId++
  try {
    // wait for the tab to be loaded completely
    await waitForTabToLoad(tabId)
    // modify the request URL to have unique URLs and hence also unique blocking rules
    request = addTimestampToURL(request, ruleId)
    // add session rule to allow the request for exact this unique URL
    log.info(`adding session rule no ${ruleId} for ${request.url}`)
    await browser.declarativeNetRequest.updateSessionRules({
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
    // send the fetch request to the content script and wait for the response
    log.info(`forwarding intercepted request to interception content script for ${request.url}`)
    const serializedRequest = await serializeRequest(request)
    const serializedResponse = await sendMessage('fetchRequest', serializedRequest, tabId)
    // process the response
    if (serializedResponse instanceof Error) {
      log.error(`error received from interception content script for ${request.url}`, serializedResponse)
      throw serializedResponse
    } else {
      log.info(`response received from interception content script for ${request.url}`)
      return deserializeResponse(serializedResponse)
    }
  } catch (e) {
    log.error(
      `failed to fetch intercepted request ${request.url} from content script`,
      e instanceof Error ? e : new Error(String(e))
    )
    throw e
  } finally {
    // remove the session rule after processing the request
    log.info(`removing session rule no ${ruleId} for ${request.url}`)
    await browser.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] })
  }
}

export async function processInterceptedRequestResponse({
  response,
  source,
}: {
  response: Response | DeserializedResponse
  source: string
}): Promise<void> {
  let nzbFiles: NZBFileObject[] = [] // Initialize nzbFiles here
  const url = response.url
  const domain = getBaseDomainFromURL(url)
  const filename = getFilenameFromResponse(response as Response)
  const setting = (await getInterceptionSettings()).domains.find((d) => d.domain === domain)
  try {
    if (!setting) throw new Error('no interception settings found for this domain')
    log.info(`processing intercepted request response from ${url}`)
    nzbFiles = await handleResponseData({ response, filename, source, allowedArchives: setting.archiveFileExtensions })
    await handleNzbDialogIfNeeded(nzbFiles, filename, setting.showNzbDialog)
    await processNzbFiles(nzbFiles, filename)
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    handleError(error, nzbFiles)
    log.error('error while processing the intercepted request response', error)
    notifications.error(i18n.t('interception.fetchResponseProcessingError', [filename, source, error.message]))
  }
}

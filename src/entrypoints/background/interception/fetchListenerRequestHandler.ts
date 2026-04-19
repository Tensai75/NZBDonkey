import { fetchAndProcessInterceptedRequest } from './interceptedRequestsHandler'

import { i18n } from '#imports'
import { getSettings as getInterceptionSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import notifications from '@/services/notifications'
import { contentScriptMessageListener } from '@/utils/contentScriptUtilities'
import { deserializeRequest, getBaseDomainFromURL, SerializedRequest } from '@/utils/fetchUtilities'

export default function (): void {
  // async setup
  log.info('Setting up fetchListener message listener')
  contentScriptMessageListener('fetchListenerRequest', fetchListenerRequestContentScriptMessageListener)
}

async function fetchListenerRequestContentScriptMessageListener(message: unknown): Promise<void> {
  log.info('fetchListenerRequest message received from content script')
  let url = ''
  try {
    const typedMessage = message as {
      data: { request: SerializedRequest; sourceURL: string }
      sender?: { tab?: { id?: number } }
    }
    const request = await deserializeRequest(typedMessage.data.request)
    url = request.url
    notifications.info(i18n.t('interception.requestBlocked', [url]))
    const sourceURL = typedMessage.data.sourceURL
    const domain = getBaseDomainFromURL(sourceURL)
    const tabId = typedMessage.sender?.tab?.id ?? -1
    const setting = (await getInterceptionSettings()).domains.find((d) => d.domain === domain)
    if (!setting) {
      log.error(`No interception settings found for domain ${domain}, cannot process fetchListenerRequest`)
      return
    }
    await fetchAndProcessInterceptedRequest(request, setting, domain, tabId, sourceURL)
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    const typedMessage = message as {
      data: { request: SerializedRequest; sourceURL: string }
      sender?: { tab?: { id?: number } }
    }
    log.error(`faild to intercept request from ${typedMessage.data.sourceURL}`, error)
    notifications.error(i18n.t('interception.fetchError', [url, typedMessage.data.sourceURL, error.message]))
  }
}

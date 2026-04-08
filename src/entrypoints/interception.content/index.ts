import { defineContentScript, injectScript } from '#imports'
import { getActiveDomains } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import { onMessage, sendMessage } from '@/services/messengers/extensionMessenger'
import { deserializeRequest, getBaseDomainFromURL, getHttpStatusText, serializeResponse } from '@/utils/fetchUtilities'

export default defineContentScript({
  registration: 'runtime',
  main() {
    log.initDebugLog('interception-content')
    log.info('interception content script loaded successfully')

    // Immediately wake up the background script
    sendMessage('heartbeat', null)

    // Then set up a heartbeat to keep the background script alive
    setInterval(() => {
      log.info('sending heartbeat message to background script')
      sendMessage('heartbeat', null)
    }, 25000) // every 25 seconds

    // Listen for fetch requests from the background script
    onMessage('fetchRequest', async (message) => {
      log.info(`fetch request message received`)
      try {
        const deserializedRequest = await deserializeRequest(message.data)
        log.info(`fetching ${deserializedRequest.url}`)
        const response = await fetch(deserializedRequest)
        if (!response.ok) {
          throw new Error(`${response.status} - ${getHttpStatusText(response.status)}`)
        }
        const serializedResponse = await serializeResponse(response)
        log.info(`sending serialized response back to background script`)
        return serializedResponse
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e))
        log.error('error fetching intercepted request', error)
        return error
      }
    })

    // Inject the fetchListener script into the page if required
    getActiveDomains().then(async (domains) => {
      const sourceURL = window.location.href
      const currentDomain = getBaseDomainFromURL(sourceURL)
      const domainSettings = domains.filter(
        (d) => d.domain === currentDomain && d.interceptionMethod === 'fetchListener'
      )[0]
      if (!domainSettings) {
        return
      }
      log.info(
        `Domain ${currentDomain} is set to be intercepted with fetchListener, injecting fetchListener content script`
      )
      try {
        await injectScript('/fetchListener.js', {
          modifyScript(script) {
            script.addEventListener('fromFetchListenerScript', (event) => {
              if (event instanceof CustomEvent) {
                log.info('fetch request received from fetchListener script, sending request to background script')
                sendMessage('fetchListenerRequest', { request: event.detail, sourceURL })
              }
            })
            script.dataset['fetchURLRegexp'] = domainSettings.pathRegExp
          },
        })
        log.info('fetchListener content script injected successfully')
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e))
        log.error('error injecting fetchListener script', error)
      }
    })
  },
})

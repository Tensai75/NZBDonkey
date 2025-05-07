import { defineContentScript, injectScript, ScriptPublicPath, toRaw } from '#imports'
import { DomainSettings, useSettings as useInterceptionSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import { sendMessage } from '@/services/messengers/extensionMessenger'
import { websiteMessenger } from '@/services/messengers/windowMessenger'

const injectionScript: ScriptPublicPath = '/injection.js'

export default defineContentScript({
  registration: 'runtime',
  main() {
    log.initDebugLog('interception-content')
    log.initMessageListener()
    log.initDebugLog('interception-content')
    log.info('interception content script loaded')
    websiteMessenger.onMessage('getDomainSetting', (message) => {
      useInterceptionSettings()
        .then((settings) => {
          const setting = settings.value.domains.find(
            (domain: DomainSettings) => domain.isActive && domain.domain === message.data
          )
          websiteMessenger.sendMessage('domainSetting', toRaw(setting)).catch((e: Error) => {
            log.error('error when sending message from content script', e)
          })
        })
        .catch((e: Error) => {
          log.error('error loading settings in content script', e)
        })
    })
    websiteMessenger.onMessage('interceptedRequest', (message) => {
      log.info('forwarding intercepted request to background script')
      sendMessage('interceptedRequest', message.data).catch((e: Error) => {
        log.error('error while sending intercepted request from content script', e)
      })
    })
    websiteMessenger.onMessage('interceptedRequestResponse', (message) => {
      log.info('forwarding intercepted request response to background script')
      sendMessage('interceptedRequestResponse', message.data).catch((e: Error) => {
        log.error('error while sending intercepted request response from content script', e)
      })
    })
    websiteMessenger.onMessage('interceptedRequestFetchError', (message) => {
      log.info('forwarding intercepted request fetch error to background script')
      sendMessage('interceptedRequestFetchError', message.data).catch((e: Error) => {
        log.error('error while sending intercepted request fetch error from content script', e)
      })
    })

    log.info('injecting the interception injection script')
    injectScript(injectionScript, {
      keepInDom: true,
    })
      .then(() => {
        log.info('injecting the interception injection script successfull')
      })
      .catch((e: Error) => {
        log.error('error while injecting the interception injection script', e)
      })
  },
})

import { defineContentScript } from '#imports'
import log from '@/services/logger/debugLogger'
import { onMessage, sendMessage } from '@/services/messengers/extensionMessenger'
import { deserializeRequest, getHttpStatusText, serializeResponse } from '@/utils/fetchUtilities'

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

    onMessage('fetchRequest', async (message) => {
      log.info(`fetch request message received`)
      try {
        const deserializedRequest = deserializeRequest(message.data)
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
  },
})

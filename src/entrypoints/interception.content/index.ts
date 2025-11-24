import { defineContentScript } from '#imports'
import log from '@/services/logger/debugLogger'
import { onMessage } from '@/services/messengers/extensionMessenger'
import { deserializeRequest, getHttpStatusText, serializeResponse } from '@/utils/fetchUtilities'

export default defineContentScript({
  registration: 'runtime',
  main() {
    log.initDebugLog('interception-content')
    log.info('interception content script loaded successfully')

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
        const error = e instanceof Error ? e : new Error('unknown error')
        log.error('error fetching intercepted request', error)
        return error
      }
    })
  },
})

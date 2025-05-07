import { defineExtensionMessaging } from '@webext-core/messaging'
import { defineWindowMessaging } from '@webext-core/messaging/page'

import { DebugLogProtocolMap, IDebugLog } from './loggerDB'

const extensionMessenger = defineExtensionMessaging<DebugLogProtocolMap>()
const websiteMessenger = defineWindowMessaging<DebugLogProtocolMap>({ namespace: 'nzbdonkey' })

const log = (message: IDebugLog) => send(message)
const clear = () => extensionMessenger.sendMessage('debbugLoggerClear', undefined)
const get = () => {
  return extensionMessenger.sendMessage('debbugLoggerGet', undefined)
}
const init = () => initialise()

const send = (message: IDebugLog): void => {
  console[message.type](
    `[NZBDonkey] ${message.text.charAt(0).toUpperCase() + message.text.slice(1)}`,
    message.error ?? ''
  )
  extensionMessenger.sendMessage('debbugLoggerLog', message)
}

const initialise = () => {
  websiteMessenger.onMessage('debbugLoggerLog', (message) => {
    extensionMessenger.sendMessage('debbugLoggerLog', message.data)
  })
}

export { clear, get, init, log }

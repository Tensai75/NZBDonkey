import { defineExtensionMessaging } from '@webext-core/messaging'

import { DebugLogProtocolMap, IDebugLog } from './loggerDB'

const extensionMessenger = defineExtensionMessaging<DebugLogProtocolMap>()

const log = (message: IDebugLog) => send(message)
const clear = () => extensionMessenger.sendMessage('debbugLoggerClear', undefined)
const get = () => {
  return extensionMessenger.sendMessage('debbugLoggerGet', undefined)
}
const init = () => {}

const send = (message: IDebugLog): void => {
  console[message.type](
    `[NZBDonkey] ${message.text.charAt(0).toUpperCase() + message.text.slice(1)}`,
    message.error ?? ''
  )
  extensionMessenger.sendMessage('debbugLoggerLog', message)
}

export { clear, get, init, log }

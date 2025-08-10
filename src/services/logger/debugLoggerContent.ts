import { defineExtensionMessaging } from '@webext-core/messaging'

import { DebugLogProtocolMap, IDebugLog } from './loggerDB'

const extensionMessenger = defineExtensionMessaging<DebugLogProtocolMap>()

const log = (message: IDebugLog) => {
  console[message.type](
    `[NZBDonkey] ${message.text.charAt(0).toUpperCase() + message.text.slice(1)}`,
    message.error ?? ''
  )
  extensionMessenger.sendMessage('debbugLoggerLog', message)
}
const clear = () => extensionMessenger.sendMessage('debbugLoggerClear', undefined)
const get = () => {
  return extensionMessenger.sendMessage('debbugLoggerGet', undefined)
}

export { clear, get, log }

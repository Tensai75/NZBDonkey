import { defineExtensionMessaging } from '@webext-core/messaging'

import { DebugLogProtocolMap, DebugLogQuery, IDebugLog } from './loggerDB'

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
const getLazy = (debugLogQuery: DebugLogQuery) => {
  return extensionMessenger.sendMessage('debbugLoggerGetLazy', debugLogQuery)
}
const count = (debugLogQuery: DebugLogQuery) => {
  return extensionMessenger.sendMessage('debbugLoggerCount', debugLogQuery)
}
const download = () => {
  return extensionMessenger.sendMessage('debbugLoggerDownload', undefined)
}
const getSources = () => {
  return extensionMessenger.sendMessage('debbugLoggerGetSources', undefined)
}

export { clear, count, download, get, getLazy, getSources, log }

import { defineExtensionMessaging } from '@webext-core/messaging'

import { db, DebugLogProtocolMap, IDebugLog } from './loggerDB'

import { getSettings as getGeneralSettings } from '@/services/general'

const extensionMessenger = defineExtensionMessaging<DebugLogProtocolMap>()

const log = (message: IDebugLog) => saveDebugLog(message)
const clear = () => clearDebugLog()
const get = () => {
  return getDebugLog()
}
const init = () => initialise()

const initialise = () => {
  extensionMessenger.onMessage('debbugLoggerLog', (message) => {
    saveDebugLog(message.data)
  })
  extensionMessenger.onMessage('debbugLoggerClear', () => {
    clearDebugLog()
  })
  extensionMessenger.onMessage('debbugLoggerGet', async (): Promise<IDebugLog[]> => {
    return getDebugLog()
  })
}

const saveDebugLog = (message: IDebugLog): void => {
  console[message.type](
    `[NZBDonkey] ${message.text.charAt(0).toUpperCase() + message.text.slice(1)} [from ${message.source}]`,
    message.error ?? ''
  )
  getGeneralSettings().then((settings) => {
    if (settings.debug || import.meta.env.DEV) {
      db.debugLog.add(message).then(() => {
        // Keep only the 1000 newest log entries
        db.debugLog
          .orderBy('date')
          .reverse()
          .offset(1000)
          .toArray()
          .then((oldEntries) => {
            const oldIds = oldEntries.map((entry) => entry.id).filter((id): id is number => id !== undefined)
            db.debugLog.bulkDelete(oldIds)
          })
      })
    }
  })
}

const clearDebugLog = (): void => {
  db.debugLog.clear()
}

const getDebugLog = async (): Promise<IDebugLog[]> => {
  return db.debugLog.orderBy('date').toArray()
}

export { clear, get, init, log }

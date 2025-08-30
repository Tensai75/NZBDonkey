import { formatDate } from '@vueuse/core'
import { defineExtensionMessaging } from '@webext-core/messaging'

import { db, DebugLogProtocolMap, DebugLogQuery, IDebugLog } from './loggerDB'

import { Browser } from '#imports'
import { getSettings as getGeneralSettings } from '@/services/general'
import { b64EncodeUnicode } from '@/utils/stringUtilities'

const extensionMessenger = defineExtensionMessaging<DebugLogProtocolMap>()

const log = (message: IDebugLog) => saveDebugLog(message)
const clear = () => clearDebugLog()
const get = () => {
  return getDebugLog()
}
const getLazy = (debugLogQuery: DebugLogQuery) => {
  return getDebugLogLazy(debugLogQuery)
}
const count = (debugLogQuery: DebugLogQuery) => {
  return countQuery(debugLogQuery)
}
const download = () => downloadLogs()
const getSources = () => getAvailableSources()
const init = () => {
  extensionMessenger.onMessage('debbugLoggerLog', (message) => {
    saveDebugLog(message.data)
  })
  extensionMessenger.onMessage('debbugLoggerClear', () => {
    clearDebugLog()
  })
  extensionMessenger.onMessage('debbugLoggerGet', async (): Promise<IDebugLog[]> => {
    return getDebugLog()
  })
  extensionMessenger.onMessage('debbugLoggerGetLazy', async (message): Promise<IDebugLog[]> => {
    return getDebugLogLazy(message.data)
  })
  extensionMessenger.onMessage('debbugLoggerCount', async (message): Promise<number> => {
    return countQuery(message.data)
  })
  extensionMessenger.onMessage('debbugLoggerDownload', async (): Promise<void> => {
    return downloadLogs()
  })
  extensionMessenger.onMessage('debbugLoggerGetSources', async (): Promise<string[]> => {
    return getAvailableSources()
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
        // Keep only the 100000 newest log entries
        db.debugLog
          .orderBy('date')
          .reverse()
          .offset(100000)
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

const getDebugLogLazy = async (debugLogQuery: DebugLogQuery): Promise<IDebugLog[]> => {
  const results = db.debugLog
    .orderBy(debugLogQuery.sortField ?? 'date')
    .filter((debugLog) => filterQuery(debugLog, debugLogQuery))
    .offset(debugLogQuery.first)
    .limit(debugLogQuery.last - debugLogQuery.first)
  if (debugLogQuery.sortOrder === 'desc') {
    results.reverse()
  }
  return results.toArray()
}

const countQuery = async (debugLogQuery: DebugLogQuery): Promise<number> => {
  const result = db.debugLog.filter((debugLog) => filterQuery(debugLog, debugLogQuery))
  return result.count()
}

const filterQuery = (debugLog: IDebugLog, debugLogQuery: DebugLogQuery) => {
  if (debugLogQuery.filter) {
    let include = true
    include = typeof debugLogQuery.filter.type === 'undefined' || debugLog.type === debugLogQuery.filter.type
    include =
      include && (typeof debugLogQuery.filter.source === 'undefined' || debugLog.source === debugLogQuery.filter.source)
    include =
      include &&
      (typeof debugLogQuery.filter.text === 'undefined' ||
        debugLog.text.toLowerCase().includes(debugLogQuery.filter.text.toLowerCase()))
    return include
  }
  return true
}

const downloadLogs = async (): Promise<void> => {
  const logs = await db.debugLog.orderBy('id').reverse().toArray()
  if (logs.length === 0) {
    throw new Error('No NZB logs found')
  }
  const csvContent = logs
    .map((log) => {
      const formattedDate = formatDate(new Date(log.date), 'DD.MM.YYYY HH:mm:ss.SSS')
      return `${log.id};${formattedDate};${log.type};${log.text};${log.error};${log.source}`
    })
    .join('\n')

  const header = 'ID;Date;Type;Text;Error;Source\n'
  const csvContentWithHeader = header + csvContent

  // Create URL (blob for Firefox, data URL for Chrome)
  let url: string
  if (import.meta.env.FIREFOX) {
    const blob = new Blob([csvContentWithHeader], { type: 'text/csv' })
    url = URL.createObjectURL(blob)
  } else {
    // Chrome: blob: not supported by downloads API in MV3 service worker
    // Use data:; base64 to be safe with any binary chars
    url = 'data:text/csv;base64,' + b64EncodeUnicode(csvContentWithHeader)
  }

  const downloadOptions: Browser.downloads.DownloadOptions = {
    filename: 'debug_logs.csv',
    saveAs: true,
    conflictAction: 'uniquify',
    url,
  }
  browser.downloads.download(downloadOptions)
}

const getAvailableSources = async (): Promise<string[]> => {
  const allSources = await db.debugLog.toArray()
  // Extract status and filter unique values
  return [...new Set(allSources.map((log) => log.source).filter((source): source is string => source !== undefined))]
}

export { clear, count, download, get, getLazy, getSources, init, log }

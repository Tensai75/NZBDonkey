import { Browser } from '#imports'
import { getSettings } from '@/services/general'
import { db, INZBLog, Target } from '@/services/logger/loggerDB'
import { NZBFileObject } from '@/services/nzbfile'
import { b64EncodeUnicode } from '@/utils/stringUtilities'

export default {
  log: (nzbFile: NZBFileObject) => log(nzbFile),
  clear: () => db.nzbLog.clear(),
  get: () => {
    return db.nzbLog.orderBy('id').reverse().toArray()
  },
  getLazy: (first: number, last: number) => {
    return db.nzbLog
      .orderBy('id')
      .reverse()
      .offset(first)
      .limit(last - first)
      .toArray()
  },
  count: () => {
    return db.nzbLog.count()
  },
  download: () => downloadLogs(),
}

const log = async (nzbFile: NZBFileObject): Promise<number> => {
  const settings = await getSettings()
  if (!settings.nzbLog) {
    return -1
  }
  const logInfo: INZBLog = {
    id: nzbFile.id,
    date: Date.now(),
    status: nzbFile.status,
    title: nzbFile.title,
    header: nzbFile.header,
    password: nzbFile.password,
    filename: nzbFile.filename,
    searchEngine: nzbFile.searchEngine,
    source: nzbFile.source,
    errorMessage: nzbFile.errorMessage,
    targets: [],
  }
  const targets: Target[] = []
  nzbFile.targets.forEach((target) => {
    const targetStatus: Target = {
      name: target.name,
      category: typeof target.selectedCategory === 'string' ? target.selectedCategory : '',
      status: target.isActive ? (typeof target.status === 'string' ? target.status : 'pending') : 'inactive',
      errorMessage: target.errorMessage,
    }
    targets.push(targetStatus)
  })
  logInfo.targets = targets
  return db.nzbLog.put(logInfo)
}

const downloadLogs = async (): Promise<void> => {
  const logs = await db.nzbLog.orderBy('id').reverse().toArray()
  if (logs.length === 0) {
    throw new Error('No NZB logs found')
  }
  const csvContent = logs
    .map((log) => {
      const formattedDate = new Date(log.date).toLocaleString()
      return `${log.id};${formattedDate};${log.status};${log.title};${log.header};${log.password};${log.filename};${log.searchEngine};${log.source};${log.errorMessage};${JSON.stringify(log.targets)}`
    })
    .join('\n')

  const header = 'ID;Date;Status;Title;Header;Password;Filename;Search Engine;Source;Error Message;Targets\n'
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
    filename: 'nzb_logs.csv',
    saveAs: true,
    conflictAction: 'uniquify',
    url,
  }
  browser.downloads.download(downloadOptions)
}

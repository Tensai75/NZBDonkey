import { getSettings } from '@/services/general'
import { db, INZBLog, Target } from '@/services/logger/loggerDB'
import { NZBFileObject } from '@/services/nzbfile'

export default {
  log: (nzbFile: NZBFileObject) => log(nzbFile),
  clear: () => db.nzbLog.clear(),
  get: () => {
    return db.nzbLog.orderBy('id').toArray()
  },
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

import Dexie from 'dexie/dist/dexie.js'

class NZBDonkeyDatabase extends Dexie {
  // Declare implicit table properties.
  // (just to inform Typescript. Instantiated by Dexie in stores() method)
  debugLog!: Dexie.Table<IDebugLog, number> // number = type of the primkey
  nzbLog!: Dexie.Table<INZBLog, number> // number = type of the primkey

  constructor() {
    super('NZBDonkeyDatabase')
    this.version(1).stores({
      debugLog: '++id, date, type, text, source, error',
      nzbLog: '++id, date, status, targets, searchEngine, source, error',
    })
  }
}

interface IDebugLog {
  id?: number
  date: number
  type: 'info' | 'warn' | 'error'
  text: string
  source: string
  error: string
}

interface DebugLogProtocolMap {
  debbugLoggerLog(data: IDebugLog): void
  debbugLoggerGet(): IDebugLog[]
  debbugLoggerClear(): void
}

interface INZBLog {
  id?: number
  date: number
  status?: NZBStatus
  title: string
  header: string
  password: string
  filename: string
  targets: Target[]
  searchEngine?: string
  source?: string
  errorMessage?: string
}

interface NzbLogProtocolMap {
  nzbLoggerLog(data: INZBLog): void
  nzbLoggerGet(): INZBLog[]
  nzbLoggerGetLazy(data: { first: number; last: number }): INZBLog[]
  nzbLoggerClear(): void
}

type NZBStatus = 'initiated' | 'searching' | 'fetched' | 'error' | 'warn' | 'success'
type Target = {
  name: string
  category?: string
  status?: TargetStatus
  errorMessage?: string
}
type TargetStatus = 'inactive' | 'pending' | 'success' | 'error'

const db = new NZBDonkeyDatabase()

export { db, DebugLogProtocolMap, IDebugLog, INZBLog, NzbLogProtocolMap, NZBStatus, Target, TargetStatus }

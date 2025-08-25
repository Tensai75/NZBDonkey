import Dexie from 'dexie/dist/dexie.js'

export class NZBDonkeyDatabase extends Dexie {
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

export interface IDebugLog {
  id?: number
  date: number
  type: DebugLogType
  text: string
  source: string
  error: string
}

export interface DebugLogProtocolMap {
  debbugLoggerLog(data: IDebugLog): void
  debbugLoggerGet(): IDebugLog[]
  debbugLoggerGetLazy(data: DebugLogQuery): IDebugLog[]
  debbugLoggerClear(): void
  debbugLoggerCount(data: DebugLogQuery): number
  debbugLoggerDownload(): Promise<void>
}

export type DebugLogType = 'info' | 'warn' | 'error'
export type DebugLogSortField = 'date'
export type DebugLogSortOrder = 'asc' | 'desc'
export type DebugLogFilter = {
  type?: DebugLogType
  source?: string
  text?: string
}
export type DebugLogQuery = {
  first: number
  last: number
  sortField?: DebugLogSortField
  sortOrder?: DebugLogSortOrder
  filter?: DebugLogFilter
}

export interface INZBLog {
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

export interface NzbLogProtocolMap {
  nzbLoggerLog(data: INZBLog): void
  nzbLoggerGet(): INZBLog[]
  nzbLoggerGetLazy(data: { first: number; last: number }): INZBLog[]
  nzbLoggerClear(): void
}

export type NZBStatus = 'initiated' | 'searching' | 'fetched' | 'error' | 'warn' | 'success'
export type Target = {
  name: string
  category?: string
  status?: TargetStatus
  errorMessage?: string
}
export type TargetStatus = 'inactive' | 'pending' | 'success' | 'error'

export const db = new NZBDonkeyDatabase()

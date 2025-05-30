import { TargetSettings, Settings as TargetsSettings, TargetType } from './settings'

import { NZBFileObject } from '@/services/nzbfile'

export type Target = {
  type: string
  name: string
  description: string
  canHaveCategories: boolean
  hasTargetCategories: boolean
  hasConnectionTest: boolean
  hasAdvancedSettings: boolean
  settings: TargetsSettings
  functions: Functions
}

type Functions = {
  push: (nzbFile: NZBFileObject, targetsettings: TargetSettings) => Promise<void>
  testConnection?: (targetsettings: TargetSettings) => Promise<boolean>
  getCategories?: (targetsettings: TargetSettings) => Promise<string[]>
}

export { type Settings as DownloadTargetSettings } from './download'
export { type Settings as JdownloaderTargetSettings } from './jdownloader'
export { type Settings as NzbgetTargetSettings } from './nzbget'
export { type Settings as PremiumizeTargetSettings } from './premiumize'
export { type Settings as SabnzbdTargetSettings } from './sabnzbd'
export { type Settings as SynologyTargetSettings } from './synology'
export { type Settings as TorboxTargetSettings } from './torbox'

export const targetList: TargetType[] = [
  'download',
  'jdownloader',
  'nzbget',
  'premiumize',
  'sabnzbd',
  'synology',
  'torbox',
]

export * as download from './download'
export * as jdownloader from './jdownloader'
export * as nzbget from './nzbget'
export * as premiumize from './premiumize'
export * as sabnzbd from './sabnzbd'
export * as synology from './synology'
export * as torbox from './torbox'

export * from './functions'
export {
  defaultSettings,
  get as getSettings,
  set as saveSettings,
  use as useSettings,
  watch as watchSettings,
  type TargetSettings,
  type Settings as TargetsSettings,
  type TargetType,
} from './settings'

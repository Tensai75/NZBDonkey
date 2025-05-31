import { Settings as DownloadSettings } from './download'
import { Settings as JDownloaderSettings } from './jdownloader'
import { Settings as NzbgetSettings } from './nzbget'
import { Settings as PremiumizeSettings } from './premiumize'
import { Settings as SabnzbdSettings } from './sabnzbd'
import { Settings as SynologySettings } from './synology'
import { Settings as TorboxSettings } from './torbox'

import { CategoriesSettings } from '@/services/categories'
import { getSettings, setSettings, useSettings, watchSettings } from '@/utils/settingsUtilities'

const name = 'targetSettings'

export const defaultSettings: Settings = {
  allowMultipleTargets: false,
  targets: [],
}

export type Settings = {
  allowMultipleTargets: boolean
  targets: TargetSettings[]
}

export type TargetSettings = {
  type: TargetType
  name: string
  isActive: boolean
  settings:
    | DownloadSettings
    | JDownloaderSettings
    | NzbgetSettings
    | PremiumizeSettings
    | SabnzbdSettings
    | SynologySettings
    | TorboxSettings
  categories: CategoriesSettings
}

export type TargetType = 'download' | 'jdownloader' | 'nzbget' | 'premiumize' | 'sabnzbd' | 'synology' | 'torbox'

export const use = async () => useSettings<Settings>({ name, defaults: defaultSettings })
export const get = async () => getSettings<Settings>({ name, defaults: defaultSettings })
export const set = async (newSettings: Settings) =>
  setSettings<Settings>({ name, defaults: defaultSettings }, newSettings)
export const watch = (callback: (settings: Settings) => void) =>
  watchSettings<Settings>({ name, defaults: defaultSettings }, callback)

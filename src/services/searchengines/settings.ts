import { Settings as DefaultEngineSettings } from './defaultEngine/settings'
import { Settings as EasyNewsEngineSettings } from './easyNewsEngine/settings'

import { getSettings, setSettings, useSettings, watchSettings } from '@/utils/settingsUtilities'

export const name = 'serachenginesSettings'

export const defaultSettings: Settings = {
  searchOrder: 'parallel',
  engines: [],
}

export type Settings = {
  searchOrder: 'parallel' | 'sequential'
  engines: SearchEngine[]
}

export type SearchEngine = {
  type: EngineType
  name: string
  isActive: boolean
  isDefault: boolean
  settings: DefaultEngineSettings | EasyNewsEngineSettings
  icon?: string
}

export type EngineType = 'defaultEngine' | 'easyNewsEngine'

export const use = async () => useSettings<Settings>({ name, defaults: defaultSettings })
export const get = async () => getSettings<Settings>({ name, defaults: defaultSettings })
export const set = async (newSettings: Settings) =>
  setSettings<Settings>({ name, defaults: defaultSettings }, newSettings)
export const watch = (callback: (settings: Settings) => void) =>
  watchSettings<Settings>({ name, defaults: defaultSettings }, callback)

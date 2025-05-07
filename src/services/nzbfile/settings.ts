import { getSettings, setSettings, useSettings, watchSettings } from '@/utils/settingsUtilities'

export const name = 'nzbfileSettings'

export const defaultSettings: Settings = {
  addPassword: true,
  addTitle: true,
  addPasswordToFilename: true,
  processTitle: true,
  processTitleType: 'spaces',
  fileCheck: true,
  fileCheckThreshold: 1,
  segmentCheck: true,
  segmentCheckThreshold: 2,
}

export type Settings = {
  addPassword: boolean
  addTitle: boolean
  addPasswordToFilename: boolean
  processTitle: boolean
  processTitleType: 'spaces' | 'dots'
  fileCheck: boolean
  fileCheckThreshold: number
  segmentCheck: boolean
  segmentCheckThreshold: number
}

export const use = async () => useSettings<Settings>({ name, defaults: defaultSettings })
export const get = async () => getSettings<Settings>({ name, defaults: defaultSettings })
export const set = async (newSettings: Settings) =>
  setSettings<Settings>({ name, defaults: defaultSettings }, newSettings)
export const watch = (callback: (settings: Settings) => void) =>
  watchSettings<Settings>({ name, defaults: defaultSettings }, callback)

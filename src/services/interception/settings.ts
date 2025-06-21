import { getSettings, setSettings, useSettings, watchSettings } from '@/utils/settingsUtilities'

export const name = 'interceptionSettings'

export const defaultSettings: Settings = {
  enabled: true,
  domains: [],
}

export type Settings = {
  enabled: boolean
  domains: DomainSettings[]
}

export const defaultDomainSettings: DomainSettings = {
  isActive: true,
  domain: '',
  pathRegExp: '',
  isDefault: false,
  showNzbDialog: true,
  postDataHandling: 'sendAsURLSearchParams',
  fetchOrigin: 'background',
  archiveFileExtensions: [],
}

export type DomainSettings = {
  isActive: boolean
  domain: string
  pathRegExp: string
  isDefault: boolean
  showNzbDialog: boolean
  postDataHandling: 'sendAsFormData' | 'sendAsURLSearchParams'
  fetchOrigin: 'injection' | 'background'
  archiveFileExtensions: string[]
  icon?: string
}

export const use = async () => useSettings<Settings>({ name, defaults: defaultSettings })
export const get = async () => getSettings<Settings>({ name, defaults: defaultSettings })
export const set = async (newSettings: Settings) =>
  setSettings<Settings>({ name, defaults: defaultSettings }, newSettings)
export const watch = (callback: (settings: Settings) => void) =>
  watchSettings<Settings>({ name, defaults: defaultSettings }, callback)

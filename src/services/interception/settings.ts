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
  requiresPostDataHandling: false,
  postDataHandling: 'sendAsFormData',
  fetchOrigin: 'background',
  archiveFileExtensions: [],
  allowDownloadInterception: false,
  dontShowDoubleCountWarning: false,
}

export type DomainSettings = {
  isActive: boolean
  domain: string
  pathRegExp: string
  isDefault: boolean
  showNzbDialog: boolean
  requiresPostDataHandling: boolean
  postDataHandling: 'sendAsFormData' | 'sendAsURLSearchParams'
  fetchOrigin: 'injection' | 'background'
  archiveFileExtensions: string[]
  allowDownloadInterception?: boolean
  dontShowDoubleCountWarning?: boolean
  icon?: string
}

export const use = async () => useSettings<Settings>({ name, defaults: defaultSettings })
export const get = async () => getSettings<Settings>({ name, defaults: defaultSettings })
export const set = async (newSettings: Settings) =>
  setSettings<Settings>({ name, defaults: defaultSettings }, newSettings)
export const watch = (callback: (settings: Settings) => void) =>
  watchSettings<Settings>({ name, defaults: defaultSettings }, callback)

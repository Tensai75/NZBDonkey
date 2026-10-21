import { getSettings, setSettings, useSettings, watchSettings } from '@/utils/settingsUtilities'

export const name = 'interceptionSettings'

export const defaultSettings: Settings = {
  enabled: true,
  domains: [],
  updateOnStartup: true,
}

export type Settings = {
  enabled: boolean
  domains: DomainSettings[]
  updateOnStartup: boolean
}

export const defaultDomainSettings: DomainSettings = {
  id: '',
  isActive: true,
  domain: '',
  pathRegExp: '',
  isDefault: false,
  showNzbDialog: true,
  interceptionMethod: 'declarativeNetRequest',
  postDataHandling: 'sendAsURLSearchParams',
  fetchOrigin: 'background',
  clickListenerFilterOptions: {
    classes: [],
    attributes: [],
    contentRegExp: '',
  },
  archiveFileExtensions: [],
}

export type DomainSettings = {
  id?: string
  isActive: boolean
  domain: string
  pathRegExp: string
  isDefault: boolean
  showNzbDialog: boolean
  interceptionMethod: InterceptionMethod
  postDataHandling: 'sendAsFormData' | 'sendAsURLSearchParams'
  clickListenerFilterOptions: ClickListenerFilterOptions
  fetchOrigin: 'injection' | 'background'
  archiveFileExtensions: string[]
  icon?: string
}

export type InterceptionMethod = 'declarativeNetRequest' | 'fetchListener' | 'clickListener'

export type ClickListenerFilterOptions = {
  classes: string[]
  attributes: string[]
  contentRegExp: string
}

export const use = async () => useSettings<Settings>({ name, defaults: defaultSettings })
export const get = async () => getSettings<Settings>({ name, defaults: defaultSettings })
export const set = async (newSettings: Settings) =>
  setSettings<Settings>({ name, defaults: defaultSettings }, newSettings)
export const watch = (callback: (settings: Settings) => void) =>
  watchSettings<Settings>({ name, defaults: defaultSettings }, callback)

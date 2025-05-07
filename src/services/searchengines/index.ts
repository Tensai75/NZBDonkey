export * as defaultEngine from './defaultEngine'
export * as easyNewsEngine from './easyNewsEngine'

export { type Settings as DefaultSearchEngineSettings } from './defaultEngine/settings'
export { type Settings as EasyNewSearchsEngineSettings } from './easyNewsEngine/settings'

export {
  defaultSettings,
  get as getSettings,
  set as saveSettings,
  use as useSettings,
  watch as watchSettings,
  type EngineType,
  type SearchEngine,
  type Settings,
} from './settings'

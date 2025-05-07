import { getSettings, setSettings, useSettings, watchSettings } from '@/utils/settingsUtilities'

export const name = 'generalSettings'

export const defaultSettings: Settings = {
  catchLinks: true,
  catchLinksShowDialog: false,
  debug: true,
  textSelection: {
    title: [],
    header: [],
    password: [],
  },
  notifications: 0,
  nzbLog: true,
}

export type Settings = {
  catchLinks: boolean
  catchLinksShowDialog: boolean
  notifications: 0 | 1 | 2 | 3
  textSelection: {
    title: string[]
    header: string[]
    password: string[]
  }
  nzbLog: boolean
  debug: boolean
}

export const use = async () => useSettings<Settings>({ name, defaults: defaultSettings })
export const get = async () => getSettings<Settings>({ name, defaults: defaultSettings })
export const set = async (newSettings: Settings) =>
  setSettings<Settings>({ name, defaults: defaultSettings }, newSettings)
export const watch = (callback: (settings: Settings) => void) =>
  watchSettings<Settings>({ name, defaults: defaultSettings }, callback)

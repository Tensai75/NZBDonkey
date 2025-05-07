import { TargetSettings } from '../settings'

import { categoriesDefaultSettings } from '@/services/categories'

export const defaultSettings: TargetSettings = {
  type: 'download',
  name: 'Download',
  isActive: false,
  settings: {
    defaultPath: 'nzbfiles',
    saveAs: false,
  },
  categories: categoriesDefaultSettings,
}

export type Settings = {
  defaultPath: string
  saveAs: boolean
}

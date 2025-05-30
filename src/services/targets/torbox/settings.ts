import { TargetSettings } from '../settings'

import { categoriesDefaultSettings } from '@/services/categories'

export const defaultSettings: TargetSettings = {
  type: 'torbox',
  name: 'Torbox.app',
  isActive: false,
  settings: {
    apiKey: '',
    as_queued: false,
    timeout: 30000,
  },
  categories: categoriesDefaultSettings,
}

export type Settings = {
  apiKey: string
  as_queued: boolean
  timeout: number
}

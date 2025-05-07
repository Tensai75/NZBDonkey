import { TargetSettings } from '../settings'

import { categoriesDefaultSettings } from '@/services/categories'

export const defaultSettings: TargetSettings = {
  type: 'premiumize',
  name: 'Premiumize.me',
  isActive: false,
  settings: {
    apiKey: '',
    timeout: 30000,
  },
  categories: categoriesDefaultSettings,
}

export type Settings = {
  apiKey: string
  timeout: number
}

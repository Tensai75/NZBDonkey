import { TargetSettings } from '../settings'

import { categoriesDefaultSettings } from '@/services/categories'

export const defaultSettings: TargetSettings = {
  type: 'synology',
  name: 'Synology Downloadstation',
  isActive: false,
  settings: {
    basepath: '',
    host: 'localhost',
    password: '',
    port: '5000',
    scheme: 'http',
    username: '',
    timeout: 30000,
  },
  categories: categoriesDefaultSettings,
}

export type Settings = {
  basepath: string
  host: string
  password: string
  port: string
  scheme: 'http' | 'https'
  username: string
  timeout: number
}

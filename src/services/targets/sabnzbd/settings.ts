import { TargetSettings } from '../settings'

import { categoriesDefaultSettings } from '@/services/categories'

export const defaultSettings: TargetSettings = {
  type: 'sabnzbd',
  name: 'SABnzbd',
  isActive: false,
  settings: {
    addPaused: false,
    apiKey: '',
    basepath: '',
    basicAuthPassword: '',
    basicAuthUsername: '',
    host: 'localhost',
    port: '8080',
    scheme: 'http',
    timeout: 30000,
  },
  categories: categoriesDefaultSettings,
}

export type Settings = {
  addPaused: boolean
  apiKey: string
  basepath: string
  basicAuthPassword: string
  basicAuthUsername: string
  host: string
  port: string
  scheme: 'http' | 'https'
  timeout: number
}

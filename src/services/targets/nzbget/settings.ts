import { TargetSettings } from '../settings'

import { categoriesDefaultSettings } from '@/services/categories'

export const defaultSettings: TargetSettings = {
  type: 'nzbget',
  name: 'NZBGet',
  isActive: false,
  settings: {
    addPaused: false,
    dupeMode: 'Force',
    basepath: '',
    host: 'localhost',
    password: '',
    port: '6789',
    scheme: 'http',
    username: '',
    timeout: 30000,
  },
  categories: categoriesDefaultSettings,
}

export type Settings = {
  addPaused: boolean
  dupeMode: 'Force' | 'Score' | 'All'
  basepath: string
  host: string
  password: string
  port: string
  scheme: 'http' | 'https'
  username: string
  timeout: number
}

import { TargetSettings } from '../settings'

import { Device } from './myJDownloader'

import { categoriesDefaultSettings } from '@/services/categories'

export const defaultSettings: TargetSettings = {
  type: 'jdownloader',
  name: 'JDownloader',
  isActive: false,
  settings: {
    addPaused: false,
    device: '',
    devices: new Array<Device>(),
    password: '',
    username: '',
    timeout: 30000,
  },
  categories: categoriesDefaultSettings,
}

export type Settings = {
  addPaused: boolean
  device: string
  devices: Device[]
  password: string
  username: string
  timeout: number
}

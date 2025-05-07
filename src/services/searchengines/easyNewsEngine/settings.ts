import { SearchEngine } from '../settings'

export const defaultSettings: SearchEngine = {
  type: 'easyNewsEngine',
  isActive: true,
  name: '',
  isDefault: false,
  settings: {
    username: '',
    password: '',
    removeUnderscore: false,
    removeHyphen: false,
    setIntoQuotes: false,
  },
}

export type Settings = {
  username: string
  password: string
  removeUnderscore: boolean
  removeHyphen: boolean
  setIntoQuotes: boolean
}

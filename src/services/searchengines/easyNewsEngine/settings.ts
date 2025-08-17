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
    searchURL: '',
    downloadURL: '',
  },
}

export type Settings = {
  username: string
  password: string
  removeUnderscore: boolean
  removeHyphen: boolean
  setIntoQuotes: boolean
  searchURL: string
  downloadURL: string
}

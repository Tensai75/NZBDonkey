import { SearchEngine } from '../settings'

export const defaultSettings: SearchEngine = {
  type: 'defaultEngine',
  name: '',
  isActive: true,
  isDefault: false,
  settings: {
    searchURL: '',
    responseType: 'html',
    searchPattern: '',
    searchGroup: 1,
    downloadURL: '',
    removeUnderscore: false,
    removeHyphen: false,
    setIntoQuotes: false,
  },
}

export type Settings = {
  searchURL: string
  responseType: 'json' | 'html'
  searchPattern: string
  searchGroup: number
  downloadURL: string
  removeUnderscore: boolean
  removeHyphen: boolean
  setIntoQuotes: boolean
}

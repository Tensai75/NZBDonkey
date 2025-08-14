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
    posterPattern: '',
    searchGroup: 1,
    posterGroup: 1,
    downloadURL: '',
    removeUnderscore: false,
    removeHyphen: false,
    setIntoQuotes: false,
    groupByPoster: false,
    resultSelector: '',
  },
}

export type Settings = {
  searchURL: string
  responseType: 'json' | 'html'
  searchPattern: string
  posterPattern: string
  searchGroup: number
  posterGroup: number
  downloadURL: string
  removeUnderscore: boolean
  removeHyphen: boolean
  setIntoQuotes: boolean
  groupByPoster: boolean
  resultSelector: string
}

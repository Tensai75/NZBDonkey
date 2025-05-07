import { i18n } from '#i18n'

export const type = 'nzbget'
export const name = 'NZBGet'
export const description = i18n.t('targets.nzbget.description')
export const canHaveCategories = true
export const hasTargetCategories = true
export const hasConnectionTest = true
export const hasAdvancedSettings = true
export * from './functions'
export { defaultSettings, type Settings } from './settings'

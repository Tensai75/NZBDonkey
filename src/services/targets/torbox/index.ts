import { i18n } from '#i18n'

export const type = 'torbox'
export const name = 'Torbox.app'
export const description = i18n.t('targets.torbox.description')
export const canHaveCategories = false
export const hasTargetCategories = false
export const hasConnectionTest = true
export const hasAdvancedSettings = false
export * from './functions'
export { defaultSettings, type Settings } from './settings'

import { i18n } from '#i18n'

export const type = 'download'
export const name = 'Download'
export const description = i18n.t('targets.download.description')
export const canHaveCategories = true
export const hasTargetCategories = false
export const hasConnectionTest = false
export const hasAdvancedSettings = false
export * from './functions'
export { defaultSettings, type Settings } from './settings'

import { i18n } from '#i18n'

export const type = 'premiumize'
export const name = 'Premiumize.me'
export const description = i18n.t('targets.premiumize.description')
export const canHaveCategories = false
export const hasTargetCategories = false
export const hasConnectionTest = true
export const hasAdvancedSettings = false
export * from './functions'
export { defaultSettings, type Settings } from './settings'

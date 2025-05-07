import { i18n } from '#i18n'

export const type = 'synology'
export const name = 'Synology Downloadstation'
export const description = i18n.t('targets.synology.description')
export const canHaveCategories = false
export const hasTargetCategories = false
export const hasConnectionTest = true
export const hasAdvancedSettings = true
export * from './functions'
export { defaultSettings, type Settings } from './settings'

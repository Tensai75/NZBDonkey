import { ref, Ref, toRaw, watch } from 'vue'

import { browser } from '#imports'
import { DomainSettings, Settings as InterceptionSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'

export type Settings<T> = {
  name: string
  defaults: T
}

/**
 * Synchronizes a reactive `Ref` with browser storage.
 * @param {Settings<T>} settingsConfig - Configuration containing the name and default values of the settings.
 * @return {Promise<Ref<T>>} A reactive Ref object synchronized with the storage.
 */
export const useSettings = async <T>({ name, defaults }: Settings<T>): Promise<Ref<T>> => {
  const settingsRef = ref<T>(await getSettings({ name, defaults })) as Ref<T>
  let isUpdatingFromStorage = false // Flag to prevent infinite loops

  // Watch for changes in storage and update settingsRef
  watchSettings({ name, defaults }, (value) => {
    isUpdatingFromStorage = true
    settingsRef.value = value
    isUpdatingFromStorage = false
  })

  // Watch for changes in settingsRef and save them to storage
  watch(
    settingsRef,
    async (value) => {
      if (!isUpdatingFromStorage) {
        await setSettings({ name, defaults }, toRaw(value))
      }
    },
    { deep: true, flush: 'sync' }
  )
  return settingsRef
}

/**
 * Retrieves settings from browser storage.
 * @param {Settings<T>} settingsConfig - Configuration containing the name and default values of the settings.
 * @return {Promise<T>} The retrieved settings object.
 */
export const getSettings = async <T>({ name, defaults }: Settings<T>): Promise<T> => {
  try {
    const settings = await browser.storage.sync.get({ [name]: defaults })
    switch (name) {
      case 'interceptionSettings': {
        // For the interception settings, we need to also fetch the domain settings separately
        const allSettings = await browser.storage.sync.get(null)
        const domains = Object.entries(allSettings)
          .filter(([key]) => key.startsWith('domain.'))
          .map(([, value]) => value as DomainSettings)
        ;(settings[name] as InterceptionSettings).domains = domains
        break
      }
      default:
        break
    }
    return settings[name] as T
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`Failed to get settings for ${name}`, error)
    return defaults
  }
}

/**
 * Saves new settings to browser storage.
 * @param {Settings<T>} settingsConfig - Configuration containing the name of the settings.
 * @param {T} newSettings - The new settings object to be saved.
 * @return {Promise<void>} Resolves when the settings are saved.
 */
export const setSettings = async <T>({ name }: Settings<T>, newSettings: T): Promise<void> => {
  try {
    switch (name) {
      case 'interceptionSettings': {
        // For the interception settings, we need to save the domain settings separately to avoid hitting storage limits
        const interceptionSettings = newSettings as unknown as InterceptionSettings
        const domainSettings = interceptionSettings.domains
        const saveDomainSettingsPromises = domainSettings.map((domain) =>
          browser.storage.sync.set({ [`domain.${domain.id}`]: domain })
        )
        await Promise.all(saveDomainSettingsPromises)
        // Remove any domain settings that are no longer in the interception settings
        const allSettings = await browser.storage.sync.get(null)
        const existingDomainKeys = Object.keys(allSettings).filter((key) => key.startsWith('domain.'))
        const domainIds = new Set(domainSettings.map((d) => d.id))
        const removeDomainSettingsPromises = existingDomainKeys
          .filter((key) => {
            const id = key.replace('domain.', '')
            return !domainIds.has(id)
          })
          .map((key) => browser.storage.sync.remove(key))
        await Promise.all(removeDomainSettingsPromises)
        // Save the main interception settings without the domains
        const interceptionSettingsWithoutDomains = { ...interceptionSettings, domains: [] }
        await browser.storage.sync.set({ [name]: interceptionSettingsWithoutDomains })
        break
      }
      default:
        await browser.storage.sync.set({ [name]: newSettings })
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`Failed to save settings for ${name}`, error)
  }
}

/**
 * Watches for changes in browser storage and triggers a callback.
 * @param {Settings<T>} settingsConfig - Configuration containing the name of the settings.
 * @param {(settings: T) => void} callback - Function to call when the settings change.
 */
export const watchSettings = <T>({ name }: Settings<T>, callback: (settings: T) => void) => {
  browser.storage.sync.onChanged.addListener(async (changes) => {
    if (changes[name]) {
      const settings = await getSettings({ name, defaults: changes[name].newValue })
      callback(settings as T)
    }
  })
}

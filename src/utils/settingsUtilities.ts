import { ref, Ref, toRaw, watch } from 'vue'

import { browser, storage } from '#imports'

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
  const settings = storage.defineItem<T>(`sync:${name}`, {
    fallback: defaults,
  })

  const settingsRef = ref<T>(await settings.getValue()) as Ref<T>
  let isUpdatingFromStorage = false // Flag to prevent infinite loops

  // Watch for changes in storage and update settingsRef
  settings.watch((value) => {
    isUpdatingFromStorage = true
    settingsRef.value = value
    isUpdatingFromStorage = false
  })

  // Watch for changes in settingsRef and save them to storage
  watch(
    settingsRef,
    async (value) => {
      if (!isUpdatingFromStorage) {
        await settings.setValue(toRaw(value))
      }
    },
    { deep: true }
  )
  return settingsRef
}

/**
 * Retrieves settings from browser storage.
 * @param {Settings<T>} settingsConfig - Configuration containing the name and default values of the settings.
 * @return {Promise<T>} The retrieved settings object.
 */
export const getSettings = async <T>({ name, defaults }: Settings<T>): Promise<T> => {
  const settings = await browser.storage.sync.get({ [name]: defaults })
  return settings[name] as T
}

/**
 * Saves new settings to browser storage.
 * @param {Settings<T>} settingsConfig - Configuration containing the name of the settings.
 * @param {T} newSettings - The new settings object to be saved.
 * @return {Promise<void>} Resolves when the settings are saved.
 */
export const setSettings = async <T>({ name }: Settings<T>, newSettings: T): Promise<void> => {
  await browser.storage.sync.set({ [name]: newSettings })
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
      callback(settings)
    }
  })
}

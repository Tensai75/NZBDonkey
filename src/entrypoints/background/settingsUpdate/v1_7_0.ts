import { browser } from '#imports'
import {
  defaultSettings as interceptionDefaultSettings,
  Settings as InterceptionSettings,
  saveSettings as saveInterceptionSettings,
} from '@/services/interception'
import {
  saveSettings as saveSearchEngineSettings,
  defaultSettings as searchEngineDefaultSettings,
  Settings as SearchEnginesSettings,
} from '@/services/searchengines'

export default async function (): Promise<void> {
  await migrateInterceptionSettings()
  await migrateSearchEngineSettings()
}

async function migrateInterceptionSettings() {
  // load old settings manually to get the domains included in the interception settings
  const settings = (
    await browser.storage.sync.get({
      ['interceptionSettings']: interceptionDefaultSettings,
    })
  )['interceptionSettings'] as InterceptionSettings
  settings.domains.forEach((domain) => {
    if (!domain.interceptionMethod) {
      domain.interceptionMethod = 'declarativeNetRequest'
    }
    if (!domain.id) {
      domain.id = domain.domain
    }
  })
  // saving the updated settings will automatically save the domain settings separately in the storage
  // and remove the old combined setting, so we don't have to worry about cleaning up old settings
  await saveInterceptionSettings(settings)
}

async function migrateSearchEngineSettings() {
  // load old settings manually due to the typo in the key name
  const settings = (
    await browser.storage.sync.get({
      ['serachenginesSettings']: searchEngineDefaultSettings,
    })
  )['serachenginesSettings'] as SearchEnginesSettings
  if (settings) {
    // save settings with the correct key name
    await saveSearchEngineSettings(settings)
    // delete old settings with the typo in the key name
    await browser.storage.sync.remove('serachenginesSettings')
  }
}

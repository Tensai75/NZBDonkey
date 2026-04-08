import { saveSettings as saveInterceptionSettings } from '@/services/interception'
import {
  defaultSettings as interceptionDefaultSettings,
  Settings as InterceptionSettings,
} from '@/services/interception/settings'

export default async function (): Promise<void> {
  await migrateInterceptionSettings()
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
  })
  // saving the updated settings will automatically save the domain settings separately in the storage
  // and remove the old combined setting, so we don't have to worry about cleaning up old settings
  await saveInterceptionSettings(settings)
}

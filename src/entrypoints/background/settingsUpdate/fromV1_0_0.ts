import { browser } from '#imports'
import * as interception from '@/services/interception'
import log from '@/services/logger/debugLogger'
import * as nzbfile from '@/services/nzbfile'

export default async function (): Promise<void> {
  log.info('NZBDonkey has been updated from v1.0.0')
  log.info('migrating settings from v1.0.0')
  try {
    await migrateInterceptionSettings()
    await migrateNzbfileSettings()
    await updateVersionInStorage()
  } catch (error) {
    await handleMigrationError(error)
  }
}

async function updateVersionInStorage(): Promise<void> {
  const version = browser.runtime.getManifest().version
  await browser.storage.sync.set({ version })
  log.info(`updated settings version to ${version}`)
}

async function handleMigrationError(error: unknown): Promise<void> {
  log.error('error migrating settings:', error instanceof Error ? error : new Error(String(error)))
  await updateVersionInStorage()
}

async function migrateInterceptionSettings() {
  const settings: interception.Settings = await interception.getSettings()
  settings.domains.forEach((domain) => {
    domain.allowDownloadInterception = !!domain.allowDownloadInterception
    domain.dontShowDoubleCountWarning = !!domain.dontShowDoubleCountWarning
  })
  await interception.saveSettings(settings)
}

async function migrateNzbfileSettings() {
  const settings: nzbfile.Settings = await nzbfile.getSettings()
  settings.filesToBeRemoved = settings.filesToBeRemoved ?? []
  await nzbfile.saveSettings(settings)
}

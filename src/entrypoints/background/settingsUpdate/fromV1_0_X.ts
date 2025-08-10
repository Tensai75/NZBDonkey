import log from '@/services/logger/debugLogger'
import * as nzbfile from '@/services/nzbfile'

export default async function (): Promise<void> {
  log.info('migrating settings from v1.0.0')

  await migrateNzbfileSettings()
}

async function migrateNzbfileSettings() {
  const settings: nzbfile.Settings = await nzbfile.getSettings()
  settings.filesToBeRemoved = settings.filesToBeRemoved ?? []
  settings.addCategory = !!settings.addCategory
  await nzbfile.saveSettings(settings)
}

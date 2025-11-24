import * as nzbfile from '@/services/nzbfile'

export default async function (): Promise<void> {
  await migrateNzbfileSettings()
}

async function migrateNzbfileSettings() {
  const settings: nzbfile.Settings = await nzbfile.getSettings()
  settings.filesToBeRemoved = settings.filesToBeRemoved ?? []
  settings.addCategory = !!settings.addCategory
  await nzbfile.saveSettings(settings)
}

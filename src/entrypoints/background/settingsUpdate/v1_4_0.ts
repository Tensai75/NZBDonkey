import { updateSearchEnginesList } from '@/services/lists'
import * as searchengines from '@/services/searchengines'
import * as targets from '@/services/targets'

export default async function (): Promise<void> {
  await migrateSearchEnginesSettings()
  await migrateTargetsSettings()
}

async function migrateSearchEnginesSettings() {
  const settings: searchengines.Settings = await searchengines.getSettings()
  settings.engines = await updateSearchEnginesList(settings.engines)
  await searchengines.saveSettings(settings)
}

async function migrateTargetsSettings() {
  const settings: targets.TargetsSettings = await targets.getSettings()
  for (const target of settings.targets) {
    if (target.type === 'jdownloader') {
      ;(target.settings as targets.JdownloaderTargetSettings).timeout = 30000
    }
  }
  await targets.saveSettings(settings)
}

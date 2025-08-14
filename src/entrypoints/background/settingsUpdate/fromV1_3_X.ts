import { updateSearchEnginesList } from '@/services/lists'
import log from '@/services/logger/debugLogger'
import * as searchengines from '@/services/searchengines'

export default async function (): Promise<void> {
  log.info('migrating settings from v1.3.0')

  await migrateSearchEnginesSettings()
}

async function migrateSearchEnginesSettings() {
  const settings: searchengines.Settings = await searchengines.getSettings()
  settings.engines = await updateSearchEnginesList(settings.engines)
  await searchengines.saveSettings(settings)
}

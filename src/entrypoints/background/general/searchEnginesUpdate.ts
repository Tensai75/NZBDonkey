import { updateSearchEnginesList } from '@/services/lists/searchEnginesList'
import * as searchengines from '@/services/searchengines'

export default function (): void {
  searchengines.getSettings().then(async (settings) => {
    if (settings.updateOnStartup) {
      settings.engines = await updateSearchEnginesList(settings.engines)
      searchengines.saveSettings(settings)
    }
  })
}

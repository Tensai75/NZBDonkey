import { updateSearchEnginesList } from '@/services/lists/searchEnginesList'
import * as searchengines from '@/services/searchengines'

export default function (): void {
  // Delay the execution for 5 seconds to allow other startup tasks to complete
  setTimeout(() => {
    searchengines.getSettings().then(async (settings) => {
      if (settings.updateOnStartup) {
        settings.engines = await updateSearchEnginesList(settings.engines)
        searchengines.saveSettings(settings)
      }
    })
  }, 5000)
}

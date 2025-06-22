import searchEnginesDefaultList from '@@/lists/searchEnginesList.json'

import { fetchAndValidateList } from './functions'

import log from '@/services/logger/debugLogger'
import { SearchEngine as SearchEnginesListItem } from '@/services/searchengines'
import { defaultSettings as defaultEngineSettings } from '@/services/searchengines/defaultEngine'

const searchEnginesList = {
  url: `https://raw.githubusercontent.com/${import.meta.env.WXT_REPOSITORY_NAME}/refs/heads/${import.meta.env.WXT_BRANCH_NAME}/lists/searchEnginesList.json`,
  expectedVersion: 1,
  sortkey: 'name',
  defaultList: searchEnginesDefaultList,
  defaultKeys: [...Object.keys(defaultEngineSettings), 'icon'] as (keyof SearchEnginesListItem)[],
}

export function getSearchEnginesList(): Promise<SearchEnginesListItem[]> {
  return fetchAndValidateList<SearchEnginesListItem>(
    searchEnginesList.url,
    searchEnginesList.expectedVersion,
    searchEnginesList.sortkey as keyof SearchEnginesListItem,
    searchEnginesList.defaultList as { version: number; data: SearchEnginesListItem[] },
    searchEnginesList.defaultKeys as (keyof SearchEnginesListItem)[]
  )
}

export async function updateSearchEnginesList(engines: SearchEnginesListItem[]): Promise<SearchEnginesListItem[]> {
  log.info('updating predefined default search engines with the latest data from the search engines list')
  const searchEngineList = await fetchAndValidateList<SearchEnginesListItem>(
    searchEnginesList.url,
    searchEnginesList.expectedVersion,
    searchEnginesList.sortkey as keyof SearchEnginesListItem,
    searchEnginesList.defaultList as { version: number; data: SearchEnginesListItem[] },
    searchEnginesList.defaultKeys as (keyof SearchEnginesListItem)[]
  )
  // Get the set of engine names present in the search engines list
  const searchEngineListNames = new Set(searchEngineList.map((d) => d.name))
  // Filter and update engines
  const updatedEngines = engines
    .filter((engine) => {
      // Keep all non-default engines, and only keep default engines if their name is in searchEngineListNames
      const keep = !engine.isDefault || searchEngineListNames.has(engine.name)
      if (!keep) log.info(`removing default search engine "${engine.name}" from settings`)
      return keep
    })
    .map((engine) => {
      if (engine.isDefault && engine.type === 'defaultEngine') {
        // Find the matching engine entry
        const engineListEngine = searchEngineList.find((e) => e.name === engine.name)
        if (engineListEngine) {
          // Update the specified keys
          return {
            ...engine,
            settings: engineListEngine.settings,
            icon: engineListEngine.icon,
          }
        }
      }
      return engine
    })
  return updatedEngines
}

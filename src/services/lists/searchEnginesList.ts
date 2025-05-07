import searchEnginesDefaultList from '@@/lists/searchEnginesList.json'

import { fetchAndValidateList } from './functions'

import { SearchEngine as SearchEnginesListItem } from '@/services/searchengines'

const searchEnginesList = {
  url: `https://raw.githubusercontent.com/${import.meta.env.WXT_REPOSITORY_NAME}/refs/heads/${import.meta.env.WXT_BRANCH_NAME}/lists/searchEnginesList.json`,
  expectedVersion: 1,
  sortkey: 'name',
  defaultList: searchEnginesDefaultList,
}

export function getSearchEnginesList(): Promise<SearchEnginesListItem[]> {
  return fetchAndValidateList<SearchEnginesListItem>(
    searchEnginesList.url,
    searchEnginesList.expectedVersion,
    searchEnginesList.sortkey as keyof SearchEnginesListItem,
    searchEnginesList.defaultList as { version: number; data: SearchEnginesListItem[] }
  )
}

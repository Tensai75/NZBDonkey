import categoriesRegexpDefaultList from '@@/lists/categoriesRegExpList.json'

import { fetchAndValidateList } from './functions'

import { CategorySettings as CategoriesRegExpListItem } from '@/services/categories'

const categoriesRegexpList = {
  url: `https://raw.githubusercontent.com/${import.meta.env.WXT_REPOSITORY_NAME}/refs/heads/${import.meta.env.WXT_BRANCH_NAME}/lists/categoriesRegExpList.json`,
  expectedVersion: 1,
  sortkey: 'name',
  defaultList: categoriesRegexpDefaultList,
}

export function getCategoriesRegexpList(): Promise<CategoriesRegExpListItem[]> {
  return fetchAndValidateList<CategoriesRegExpListItem>(
    categoriesRegexpList.url,
    categoriesRegexpList.expectedVersion,
    categoriesRegexpList.sortkey as keyof CategoriesRegExpListItem,
    categoriesRegexpList.defaultList as { version: number; data: CategoriesRegExpListItem[] }
  )
}

import interceptionDomainsDefaultList from '@@/lists/interceptionDomainsList_v2.json'

import { fetchAndValidateList } from './functions'

import { DomainSettings as InterceptionDomainsListItem } from '@/services/interception'

const interceptionDoaminsList = {
  url: `https://raw.githubusercontent.com/${import.meta.env.WXT_REPOSITORY_NAME}/refs/heads/${import.meta.env.WXT_BRANCH_NAME}/lists/interceptionDomainsList_v2.json`,
  expectedVersion: 2,
  sortkey: 'domain',
  defaultList: interceptionDomainsDefaultList,
}

export function getInterceptionDomainsList(): Promise<InterceptionDomainsListItem[]> {
  return fetchAndValidateList<InterceptionDomainsListItem>(
    interceptionDoaminsList.url,
    interceptionDoaminsList.expectedVersion,
    interceptionDoaminsList.sortkey as keyof InterceptionDomainsListItem,
    interceptionDoaminsList.defaultList as { version: number; data: InterceptionDomainsListItem[] }
  )
}

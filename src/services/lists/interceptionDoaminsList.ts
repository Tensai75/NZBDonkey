import interceptionDomainsDefaultList from '@@/lists/interceptionDomainsList.json'

import { fetchAndValidateList } from './functions'

import { DomainSettings as InterceptionDomainsListItem, defaultDomainSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'

const interceptionDoaminsList = {
  url: `https://raw.githubusercontent.com/${import.meta.env.WXT_REPOSITORY_NAME}/${import.meta.env.WXT_BRANCH_NAME}/lists/interceptionDomainsList.json`,
  expectedVersion: 2,
  sortkey: 'domain',
  defaultList: interceptionDomainsDefaultList,
  defaultKeys: [...Object.keys(defaultDomainSettings), 'icon'] as (keyof InterceptionDomainsListItem)[],
}

export function getInterceptionDomainsList(): Promise<InterceptionDomainsListItem[]> {
  return fetchAndValidateList<InterceptionDomainsListItem>(
    'interception domains list',
    interceptionDoaminsList.url,
    interceptionDoaminsList.expectedVersion,
    interceptionDoaminsList.sortkey as keyof InterceptionDomainsListItem,
    interceptionDoaminsList.defaultList as { version: number; data: InterceptionDomainsListItem[] },
    interceptionDoaminsList.defaultKeys as (keyof InterceptionDomainsListItem)[]
  )
}

export async function updateInterceptionDomainsList(
  domains: InterceptionDomainsListItem[]
): Promise<InterceptionDomainsListItem[]> {
  log.info('updating predefined domains with the latest data from the interception domains list')
  const domainsList = await fetchAndValidateList<InterceptionDomainsListItem>(
    'interception domains list',
    interceptionDoaminsList.url,
    interceptionDoaminsList.expectedVersion,
    interceptionDoaminsList.sortkey as keyof InterceptionDomainsListItem,
    interceptionDoaminsList.defaultList as { version: number; data: InterceptionDomainsListItem[] },
    interceptionDoaminsList.defaultKeys as (keyof InterceptionDomainsListItem)[]
  )
  // Get the set of domain names present in the domains list
  const domainsListIDs = new Set(domainsList.map((d) => d.id))
  // Filter and update domains
  const updatedDomains = domains
    .filter((domain) => {
      // Keep all non-default domains, and only keep default domains if their domain is in domainsListDomainNames
      const keep = !domain.isDefault || domainsListIDs.has(domain.id ?? domain.domain)
      if (!keep) log.info(`removing default interception domain "${domain.domain}" from settings`)
      return keep
    })
    .map((domain) => {
      if (domain.isDefault) {
        // Find the matching domain entry
        const domainsListDomain = domainsList.find((d) => d.id === domain.id)
        if (domainsListDomain) {
          // Update the specified keys
          return {
            ...domain,
            domain: domainsListDomain.domain,
            pathRegExp: domainsListDomain.pathRegExp,
            postDataHandling: domainsListDomain.postDataHandling,
            fetchOrigin: domainsListDomain.fetchOrigin,
            archiveFileExtensions: domainsListDomain.archiveFileExtensions,
            icon: domainsListDomain.icon,
          }
        }
      }
      return domain
    })
  return updatedDomains
}

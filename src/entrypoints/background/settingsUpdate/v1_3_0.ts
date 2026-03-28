import * as interception from '@/services/interception'
import { updateInterceptionDomainsList } from '@/services/lists'
import * as searchengines from '@/services/searchengines'

export default async function (): Promise<void> {
  await migrateInterceptionSettings()
  await migrateSearchEnginesSettings()
}

async function migrateInterceptionSettings() {
  const settings: interception.Settings = await interception.getSettings()
  settings.domains.forEach((domain) => {
    // @ts-expect-error Property does not exist on type 'DomainSettings'
    delete domain.allowDownloadInterception
    // @ts-expect-error Property does not exist on type 'DomainSettings'
    delete domain.dontShowDoubleCountWarning
    // @ts-expect-error Property does not exist on type 'DomainSettings'
    delete domain.requiresPostDataHandling
    // @ts-expect-error Property does not exist on type 'DomainSettings'
    delete domain.postDataHandling
    domain.id = domain.id || domain.domain
  })
  settings.updateOnStartup = settings.updateOnStartup === undefined ? true : settings.updateOnStartup
  settings.domains = await updateInterceptionDomainsList(settings.domains)
  await interception.saveSettings(settings)
}

async function migrateSearchEnginesSettings() {
  const settings: searchengines.Settings = await searchengines.getSettings()
  settings.updateOnStartup = settings.updateOnStartup === undefined ? true : settings.updateOnStartup
  await searchengines.saveSettings(settings)
}

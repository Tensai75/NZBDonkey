import { openInfoPage } from './index'

import * as interception from '@/services/interception'
import log from '@/services/logger/debugLogger'
import * as searchengines from '@/services/searchengines'

export default async function (): Promise<void> {
  log.info('NZBDonkey has been updated from v1.2.0')
  log.info('migrating settings from v1.2.0')

  await migrateInterceptionSettings()
  await migrateSearchEnginesSettings()

  openInfoPage()
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
  })
  settings.updateOnStartup = settings.updateOnStartup === undefined ? true : settings.updateOnStartup
  await interception.saveSettings(settings)
}

async function migrateSearchEnginesSettings() {
  const settings: searchengines.Settings = await searchengines.getSettings()
  settings.updateOnStartup = settings.updateOnStartup === undefined ? true : settings.updateOnStartup
  await searchengines.saveSettings(settings)
}

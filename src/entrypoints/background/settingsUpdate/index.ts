import { PublicPath } from 'wxt/browser'

import fromV0_7_7 from './fromV0_7_7'
import fromV1_0_0 from './fromV1_0_0'
import fromV1_2_0 from './fromV1_2_0'

import { browser } from '#imports'
import log from '@/services/logger/debugLogger'

export default function (): void {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
      // check version number
      browser.storage.sync.get('version').then(async ({ version }) => {
        const oldVersion = version || '0.7.7' // default to 0.7.7 if no version is set
        const currentVersion = browser.runtime.getManifest().version
        if (oldVersion !== currentVersion) {
          log.info(`NZBDonkey has been updated to version v${currentVersion}`)
          try {
            if (oldVersion === '0.7.7') await fromV0_7_7()
            if (oldVersion === '1.0.0') await fromV1_0_0()
            if (oldVersion === '1.2.0') await fromV1_2_0()
          } catch (error) {
            handleMigrationError(error)
          } finally {
            await updateVersionInStorage(currentVersion)
          }
        }
      })
    }
  })
}

export function openInfoPage(hash: string = 'UPDATED'): void {
  const infoPageUrl = browser.runtime.getURL(`/nzbdonkey.html#${hash}` as PublicPath)
  browser.tabs.create({ url: infoPageUrl })
  log.info('opened info page')
}

async function updateVersionInStorage(version: string = browser.runtime.getManifest().version): Promise<void> {
  await browser.storage.sync.set({ version })
  log.info(`updated settings version to ${version}`)
}

function handleMigrationError(error: unknown): void {
  log.error('error migrating settings:', error instanceof Error ? error : new Error(String(error)))
  openInfoPage('UPDATED_WITH_ERROR')
}

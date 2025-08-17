import { PublicPath } from 'wxt/browser'

import { browser } from '#imports'
import log from '@/services/logger/debugLogger'

const versionUpdates: Record<string, () => Promise<void>> = {
  '0.7.7': async () => await import('./fromV0_7_7').then((mod) => mod.default()),
  '1.0.0': async () => await import('./fromV1_0_X').then((mod) => mod.default()),
  '1.2.0': async () => await import('./fromV1_2_X').then((mod) => mod.default()),
  '1.3.0': async () => await import('./fromV1_3_X').then((mod) => mod.default()),
  // Add future updates here
}

export default function (): void {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
      // check version number
      browser.storage.sync.get('version').then(async ({ version }) => {
        const oldVersion: string = version ? (version as string) : '0.7.7' // default to 0.7.7 if no version is set
        const newVersion = browser.runtime.getManifest().version
        if (oldVersion !== newVersion) {
          log.info(`NZBDonkey has been updated to version v${newVersion}`)
          try {
            const updates = Object.keys(versionUpdates)
              .filter((v) => compareVersions(v, oldVersion) >= 0)
              .sort(compareVersions)
            for (const v of updates) {
              await versionUpdates[v]()
            }
          } catch (error) {
            handleMigrationError(error)
          } finally {
            await updateVersionInStorage(newVersion)
            openInfoPage(oldVersion === '0.7.7' ? 'UPDATED_FROM_V0_7_7' : 'UPDATED')
          }
        }
      })
    }
  })
}

function openInfoPage(hash: string = 'UPDATED'): void {
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

/**
 * Compares two version strings (e.g., "1.2.3")
 * Returns:
 *  -1 if a < b
 *   0 if a == b
 *   1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }

  return 0
}

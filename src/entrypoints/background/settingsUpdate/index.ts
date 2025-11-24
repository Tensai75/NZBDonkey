import { PublicPath } from 'wxt/browser'

import { browser } from '#imports'
import log from '@/services/logger/debugLogger'

const versionUpdates: Record<string, () => Promise<void>> = {
  '1.0.0': async () => await import('./v1_0_0').then((mod) => mod.default()),
  '1.2.0': async () => await import('./v1_2_0').then((mod) => mod.default()),
  '1.3.0': async () => await import('./v1_3_0').then((mod) => mod.default()),
  '1.4.0': async () => await import('./v1_4_0').then((mod) => mod.default()),
  '1.4.3': async () => await import('./v1_4_3').then((mod) => mod.default()),
  // Add future updates here
}

export default function (): void {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
      // check version number
      browser.storage.sync.get('version').then(async ({ version }) => {
        const oldVersion: string = version ? (version as string) : '0.7.7' // default to 0.7.7 if no version is set
        const newVersion = browser.runtime.getManifest().version
        let settingsUpdate = false
        let settingsUpdateError = false
        if (oldVersion !== newVersion) {
          log.info(`NZBDonkey has been updated to version v${newVersion}`)
          for (const v in versionUpdates) {
            if (compareVersions(v, '>', oldVersion)) {
              log.info(`migrating settings to v${v}`)
              try {
                await versionUpdates[v]()
              } catch (error) {
                log.error(
                  `error migrating settings to v${v}:`,
                  error instanceof Error ? error : new Error(String(error))
                )
                settingsUpdateError = true
              }
              settingsUpdate = true
            }
          }
          await updateVersionInStorage(newVersion)
          if (settingsUpdateError) {
            openInfoPage('UPDATED_WITH_ERROR')
            return
          } else if (settingsUpdate) {
            openInfoPage(oldVersion === '0.7.7' ? 'UPDATED_FROM_V0_7_7' : 'UPDATED')
            return
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

/**
 * From https://stackoverflow.com/a/53387532
 * Compares two version strings (e.g., "1.2.3", "1.2.4-beta", "1.3.0.1").
 * @param a - The first version string.
 * @param exp - The comparison operator ('>', '<', '=').
 * @param b - The second version string.
 * @returns True if the comparison holds, false otherwise.
 */
export const compareVersions = (
  (prep: (t: string | string[]) => string[]) =>
  (a: string | string[], exp: '>' | '<' | '=', b: string | string[]): boolean => {
    a = prep(a)
    b = prep(b)
    const l: number = Math.max(a.length, b.length)
    let i: number = 0
    let r: number = 0
    while (!r && i < l)
      //convert into integer, including undefined values
      r = ~~a[i] - ~~b[i++]

    const result: '>' | '<' | '=' = r < 0 ? '<' : r ? '>' : '='
    return exp === result
  }
)((t: string | string[]) =>
  ('' + t)
    // treat non-numerical characters as lower version
    // replacing them with a negative number based on charcode of first character
    .replace(
      /[^\d.]+/g,
      (c) =>
        '.' +
        (c
          .replace(/[\W_]+/, '')
          .toUpperCase()
          .charCodeAt(0) -
          65536) +
        '.'
    )
    // remove trailing "." and "0" if followed by non-numerical characters (1.0.0b);
    .replace(/(?:\.0+)*(\.-\d+(?:\.\d+)?)\.*$/g, '$1')
    // return array
    .split('.')
)

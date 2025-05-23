import fromV0_7_7 from './fromV0_7_7'
import fromV1_0_0 from './fromV1_0_0'

import { browser } from '#imports'
import log from '@/services/logger/debugLogger'

export default function (): void {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
      log.info('NZBDonkey has been updated to version ' + browser.runtime.getManifest().version)
      // check version number
      browser.storage.sync.get('version').then(async ({ version }) => {
        if (!version) await fromV0_7_7()
        if (version === '1.0.0') await fromV1_0_0()
      })
    }
  })
}

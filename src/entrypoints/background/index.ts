import { PublicPath } from 'wxt/browser'

import { browser, defineBackground } from '#imports'
import generalBackground from '@/entrypoints/background/general'
import interceptionBackground from '@/entrypoints/background/interception'
import settingsUpdate from '@/entrypoints/background/settingsUpdate'
import log from '@/services/logger/debugLogger'
import { onMessage } from '@/services/messengers/extensionMessenger'

export default defineBackground(() => {
  log.initDebugLog('background')
  log.initMessageListener()
  settingsUpdate()
  generalBackground()
  interceptionBackground()
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      log.info('NZBDonkey has been freshly installed')
      // save the current version to storage
      browser.storage.sync.set({ version: browser.runtime.getManifest().version })
      log.info('opening info page')
      browser.tabs.create({ url: browser.runtime.getURL('/nzbdonkey.html' as PublicPath) })
    }
  })
  onMessage('momentumCheck', async (): Promise<boolean> => {
    const ports = [62234, 52234, 42234, 32234, 22234, 12234, 5003]
    const fetchPromises: Promise<boolean>[] = []
    for (const port of ports) {
      const fetchPromise = new Promise<boolean>((resolve, reject): void => {
        fetch(`http://localhost:${port}/jsonrpc/status`)
          .then(async (response) => {
            if (!response.ok) {
              reject(false)
              return
            }
            const data = await response.json()
            if (data?.version && data?.result) {
              resolve(true)
            } else {
              reject(false)
            }
          })
          .catch(() => {
            reject(false)
          })
      })
      fetchPromises.push(fetchPromise)
    }
    return await Promise.any(fetchPromises).catch(() => false)
  })
  log.info('background script loaded successfully')
})

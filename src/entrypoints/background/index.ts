import { PublicPath } from 'wxt/browser'

import { browser, defineBackground } from '#imports'
import generalBackground from '@/entrypoints/background/general'
import interceptionBackground from '@/entrypoints/background/interception'
import settingsUpdate from '@/entrypoints/background/settingsUpdate'
import log from '@/services/logger/debugLogger'

export default defineBackground(() => {
  log.initDebugLog('background')
  log.initMessageListener()
  settingsUpdate()
  generalBackground()
  interceptionBackground()
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      log.info('NZBDonkey has been freshly installed')
      log.info('clearing settings and opening info page')
      browser.storage.sync.clear().then(() => {
        browser.storage.sync.set({ version: browser.runtime.getManifest().version })
        browser.tabs.create({ url: browser.runtime.getURL('/nzbdonkey.html' as PublicPath) })
      })
    }
  })
  log.info('background script loaded successfully')
})

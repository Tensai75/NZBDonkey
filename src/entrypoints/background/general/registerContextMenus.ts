import { registerAnalyseSelectionContextMenu } from './analyseSelectionHandler'
import { registerSendToContextMenu } from './sendToHandler'

import { browser } from '#imports'
import log from '@/services/logger/debugLogger'
import { watchSettings as watchTargetSettings } from '@/services/targets'

export default function (): void {
  registerContextMenus()
  watchTargetSettings(() => {
    log.info('target settings have changed: updating context menus')
    registerContextMenus()
  })
}

async function registerContextMenus(): Promise<void> {
  // remove all existing context menus
  log.info('removing context menus')
  await browser.contextMenus.removeAll()
  await registerAnalyseSelectionContextMenu()
  await registerSendToContextMenu()
}

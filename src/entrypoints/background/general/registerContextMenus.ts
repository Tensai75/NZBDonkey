import {
  registerAnalyseSelectionContextMenu,
  registerAnalyseSelectionContextMenuListener,
} from './analyseSelectionHandler'
import { registerSendToContextMenu, registerSendToContextMenuListener } from './sendToHandler'

import log from '@/services/logger/debugLogger'
import { watchSettings as watchTargetSettings } from '@/services/targets'

export default function (): void {
  registerContextMenus()
  registerContextMenuListeners()
  watchTargetSettings(() => {
    log.info('target settings have changed: updating context menus')
    registerContextMenus()
  })
}

async function registerContextMenus(): Promise<void> {
  // remove all existing context menus
  log.info('removing all existing context menus')
  await browser.contextMenus.removeAll()
  registerAnalyseSelectionContextMenu()
  registerSendToContextMenu()
}

function registerContextMenuListeners(): void {
  registerAnalyseSelectionContextMenuListener()
  registerSendToContextMenuListener()
}

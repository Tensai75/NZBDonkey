import { Browser, browser, i18n } from '#imports'
import log from '@/services/logger/debugLogger'
import { sendMessage } from '@/services/messengers/extensionMessenger'
import { createContextMenuPromise } from '@/utils/generalUtilities'

// Extend the Window interface to include the custom property
declare global {
  interface Window {
    __NZBDONKEY_SELECTION_SCRIPT_INJECTED__?: boolean
    __TAB_ID__?: number
  }
}

const CONTEXT_MENU_ID: string = 'NZBDONKEY_Selection'
const selectionScriptSource: string = '/content-scripts/selection.js'

export async function registerAnalyseSelectionContextMenu(): Promise<void> {
  // create analyse selection context menu
  log.info('registering the analyse selection context menu')
  try {
    await createContextMenuPromise({
      title: i18n.t('contextMenu.analyseSelection'),
      contexts: ['selection'],
      id: CONTEXT_MENU_ID,
    })
  } catch (e) {
    log.error(
      'error while registering the analyse selection context menu:',
      e instanceof Error ? e : new Error(String(e))
    )
    return
  }
  log.info('registration of the analyse selection context menu was successful')
  log.info('registering the analyse selection context menu listener')
  if (browser.contextMenus.onClicked.hasListener(contextMenuListener)) {
    log.info('the analyse selection context menu listener is already registered')
  } else {
    try {
      browser.contextMenus.onClicked.addListener(contextMenuListener)
      log.info('registration of the analyse selection context menu listener was successful')
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      log.error('error while registering the analyse selection context menu listener:', error)
    }
  }
}

async function contextMenuListener(info: Browser.contextMenus.OnClickData, tab?: Browser.tabs.Tab): Promise<void> {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    try {
      // Check if the script is already injected
      const [result] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => !!window.__NZBDONKEY_SELECTION_SCRIPT_INJECTED__,
      })
      // If the script is not injected, inject it
      if (!result?.result) {
        // Set a marker to indicate the script is injected
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          func: (tabId) => {
            window.__NZBDONKEY_SELECTION_SCRIPT_INJECTED__ = true
            window.__TAB_ID__ = tabId
          },
          args: [tab.id],
        })
        // Inject the script
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: [selectionScriptSource],
        })
        log.info(`Selection script injected successfully into tab ${tab.id}.`)
      } else {
        sendMessage('analyseTextSelection', { tabId: tab.id }, tab.id)
        log.info(`Selection script already injected into tab ${tab.id}.`)
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      log.error(`Error injecting selection script into tab ${tab.id}:`, error)
    }
  }
}

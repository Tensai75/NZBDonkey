import { Browser, browser, i18n } from '#imports'
import { getSettings as getGeneralSettings } from '@/services/general'
import { handleError, handleNzbDialogIfNeeded, handleResponseData, processNzbFiles } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import notifications from '@/services/notifications'
import { NZBFileObject, NZBFileTarget } from '@/services/nzbfile'
import { getTargets } from '@/services/targets'
import { FetchOptions, getFilenameFromResponse, useFetch } from '@/utils/fetchUtilities'
import { createContextMenuPromise } from '@/utils/generalUtilities'

const CONTEXT_MENU_ID: string = 'NZBDONKEY_SendTo'
const CONTEXT_MENU_ID_TARGET: string = 'NZBDONKEY_SendTo_Target_'

export async function registerSendToContextMenu(): Promise<void> {
  const nzbTargets = await getTargets()
  if (nzbTargets.length === 0) return
  // create send to context menu
  log.info('registering the sendto context menu')
  try {
    await createContextMenuPromise({
      title: i18n.t('contextMenu.sendToSeveralTarget') + ':',
      contexts: ['link'],
      id: CONTEXT_MENU_ID,
    })
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error('error while registering the send to context menu:', error)
    return
  }
  let createError = false
  nzbTargets.forEach(async function (target, index) {
    const createOptions: Browser.contextMenus.CreateProperties & { icons?: object } = {
      title: target.name,
      contexts: ['link'],
      parentId: CONTEXT_MENU_ID,
      id: CONTEXT_MENU_ID_TARGET + index.toString(),
    }
    if (!import.meta.env.CHROME)
      createOptions.icons = {
        16: '/img/' + target.type + '.png',
      }
    try {
      await createContextMenuPromise(createOptions)
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      log.error(`error while registering the send to sub context menu with number ${index.toString}:`, error)
      createError = true
    }
  })
  if (createError) {
    log.error('registration of the send to context menu failed')
    return
  }
  log.info('registration of the send to context menu was successful')
  log.info('registering the send to context menu listener')
  if (browser.contextMenus.onClicked.hasListener(contextMenuListener)) {
    log.info('the sent to context menu listener is already registered')
  } else {
    try {
      browser.contextMenus.onClicked.addListener(contextMenuListener)
      log.info('registration of the send to context menu listener was successful')
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      log.error('error while registering the send to context menu listener:', error)
    }
  }
}

async function contextMenuListener(info: Browser.contextMenus.OnClickData, tab?: Browser.tabs.Tab): Promise<void> {
  if (info.menuItemId === CONTEXT_MENU_ID || info.parentMenuItemId === CONTEXT_MENU_ID) {
    let nzbFiles: NZBFileObject[] = []
    let filename = ''
    try {
      const loadTargets = async (): Promise<NZBFileTarget[]> => {
        let nzbTargets: NZBFileTarget[] = []
        const targetId = info.menuItemId.toString().match(new RegExp(`${CONTEXT_MENU_ID_TARGET}(\\d+)`, 'i'))
        if (targetId) {
          nzbTargets = (await getTargets()) as NZBFileTarget[]
          nzbTargets.forEach((target, index) => (target.isActive = index === parseInt(targetId[1])))
        }
        return nzbTargets
      }
      if (info.linkUrl && info.linkUrl.startsWith('nzblnk')) {
        const nzbfile = await new NZBFileObject().init()
        await nzbfile.processNzblnk(info.linkUrl ? info.linkUrl : '', tab?.url ? tab.url : '', await loadTargets())
      } else if (info.linkUrl) {
        notifications.info(i18n.t('contextMenu.sendToProcessing', [info.linkUrl]))
        const fetchOptions: FetchOptions = {
          url: info.linkUrl,
          init: { credentials: 'include' },
        }
        const response = await useFetch(fetchOptions)
        filename = getFilenameFromResponse(response)
        nzbFiles = await handleResponseData({
          response,
          filename,
          source: info.linkUrl,
          allowedArchives: ['rar', 'zip', '7z'],
        })
        const targets = await loadTargets()
        nzbFiles.forEach((nzbFile) => (nzbFile.targets = targets))
        await handleNzbDialogIfNeeded(nzbFiles, filename, (await getGeneralSettings()).catchLinksShowDialog)
        await processNzbFiles(nzbFiles, filename)
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      handleError(error, nzbFiles)
      log.error('error while processing context menu click', error)
      notifications.error(i18n.t('errors.errorWhileProcessingContextMenuClick', [error.message]))
    }
  }
}

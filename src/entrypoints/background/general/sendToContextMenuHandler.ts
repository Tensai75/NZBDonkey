import { Browser, browser, i18n } from '#imports'
import { getSettings as getGeneralSettings } from '@/services/general'
import { extractArchive } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import notifications from '@/services/notifications'
import { NZBFileObject, NZBFileTarget, showNzbFileDialog } from '@/services/nzbfile'
import { getTargets, watchSettings as watchTargetSettings } from '@/services/targets'
import { FetchOptions, getFilenameFromResponse, useFetch } from '@/utils/fetchUtilities'
import { getExtensionFromFilename } from '@/utils/stringUtilities'

const CONTEXT_MENU_ID: string = 'NZBDONKEY_SendTo'
const CONTEXT_MENU_ID_TARGET: string = 'NZBDONKEY_SendTo_Target_'

export default function (): void {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install' || details.reason === 'update') {
      registerContextMenu()
    }
  })
  browser.contextMenus.onClicked.addListener(contextMenuListener)
  watchTargetSettings(() => {
    log.info('target settings have changed: updating sendto context menu')
    registerContextMenu()
  })
}

async function registerContextMenu(): Promise<void> {
  // create send to context menu
  log.info('registering the sendto context menu')
  try {
    await browser.contextMenus.remove(CONTEXT_MENU_ID)
  } catch {
    // void error when removing the context menu if it does not exist
  }
  const nzbTargets = await getTargets()
  if (nzbTargets.length > 0) {
    browser.contextMenus.create(
      {
        title: i18n.t('contextMenu.sendToSeveralTarget') + ':',
        contexts: ['link'],
        id: CONTEXT_MENU_ID,
      },
      () => {
        nzbTargets.forEach(function (target, index) {
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
          browser.contextMenus.create(createOptions)
        })
        log.info('registering of the sendto context menu successful')
      }
    )
  }
}

async function contextMenuListener(info: Browser.contextMenus.OnClickData, tab?: Browser.tabs.Tab): Promise<void> {
  if (info.menuItemId === CONTEXT_MENU_ID || info.parentMenuItemId === CONTEXT_MENU_ID) {
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
        const fetchOptions: FetchOptions = {
          url: info.linkUrl,
          init: { credentials: 'include' },
        }
        const response = await useFetch(fetchOptions)
        let nzbFiles: NZBFileObject[] = []
        const filename = getFilenameFromResponse(response)
        const extension = getExtensionFromFilename(filename).toLowerCase()
        if (extension === 'nzb') {
          const nzbfile = await new NZBFileObject().init()
          await nzbfile.addNzbFile(await response.text(), filename, info.pageUrl ?? '', await loadTargets())
          nzbFiles.push(nzbfile)
        } else if (['zip', 'rar', '7z'].includes(extension)) {
          nzbFiles = await extractArchive(await response.blob(), info.pageUrl ?? '')
        } else {
          throw new Error('no nzb file or archive in download link')
        }
        if (nzbFiles.length === 0) throw new Error('no NZB file found in download')
        const targets = await loadTargets()
        nzbFiles.forEach((nzbFile) => (nzbFile.targets = targets))
        if ((await getGeneralSettings()).catchLinksShowDialog) {
          nzbFiles = await showNzbFileDialog(nzbFiles, filename)
        }
        nzbFiles.forEach((nzbFile) => nzbFile.process())
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
      const errorMessage = i18n.t('errors.errorWhileProcessingContextMenuCLick', [error.message])
      log.error(errorMessage, error)
      notifications.error(errorMessage)
    }
  }
}

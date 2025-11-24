import { NZBFileObject } from './nzbFile.class'

import { i18n } from '#i18n'
import { browser, Browser } from '#imports'
import log from '@/services/logger/debugLogger'
import { openPopupWindow } from '@/utils/popupWindowUtilities'

export function analyseNzbLink(link: string): { h: string; t: string; p: string } {
  if (!link || !/^nzblnk/i.test(link)) {
    throw new Error(i18n.t('errors.invalidNzblnkLink'))
  }
  const nzblnkParameters: { h: string; t: string; p: string } = { h: '', t: '', p: '' }
  const matches = [...link.matchAll(/(?:[&?](?:amp;)*([htpgd])=([^&]+))/gi)]
  matches.forEach(([, key, value]) => {
    if (key in nzblnkParameters) {
      nzblnkParameters[key as keyof typeof nzblnkParameters] = decodeURIComponent(value)
    }
  })
  if (!nzblnkParameters.h) {
    throw new Error(i18n.t('errors.invalidNzblnkLink'))
  }
  nzblnkParameters.t ||= nzblnkParameters.h // Default `t` to `h` if not provided
  return nzblnkParameters
}

export async function showNzbFileDialog(
  nzbFile: NZBFileObject | NZBFileObject[],
  filename: string = ''
): Promise<NZBFileObject[]> {
  const nzbFiles = Array.isArray(nzbFile) ? nzbFile : [nzbFile]
  return new Promise((resolve, reject) => {
    openPopupWindow('/nzbdialog.html')
      .then((windowId) => {
        const handlePortMessage = (message: NZBFileObject[] | null) => {
          if (Array.isArray(message)) {
            resolve(processNzbFiles(message))
          } else {
            log.info('NZB dialog window was cancelled')
            cancel()
          }
        }
        const handleWindowClose = (winId: number) => {
          if (windowId === winId) {
            log.warn(`NZB dialog window with id ${windowId} was closed before sending a message`)
            cancel()
          }
        }
        const processNzbFiles = (message: NZBFileObject[] | null): NZBFileObject[] => {
          const processedFiles: NZBFileObject[] = message
            ? message.map((nzbFileData) => {
                const nzbFile = new NZBFileObject()
                Object.assign(nzbFile, nzbFileData)
                nzbFile.log(nzbFile)
                return nzbFile
              })
            : []
          cleanup()
          browser.windows.remove(windowId)
          return processedFiles
        }
        const cancel = async () => {
          nzbFiles.forEach((file) => {
            file.status = 'error'
            file.errorMessage = i18n.t('common.abortedByUser')
            file.targets.forEach((target) => (target.status = 'inactive'))
            file.log(file)
          })
          cleanup()
          try {
            await browser.windows.remove(windowId)
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e))
            log.error(`Failed to remove NZB dialog window with id ${windowId}:`, error)
          }
          reject(new Error(i18n.t('common.abortedByUser')))
        }
        const cleanup = () => {
          browser.runtime.onConnect.removeListener(onConnectListener)
          browser.windows.onRemoved.removeListener(onRemovedWindowListener)
        }
        const onConnectListener = (port: Browser.runtime.Port) => {
          if (port.name === `nzbDialog_${windowId}`) {
            port.onMessage.addListener(handlePortMessage)
            port.postMessage({
              nzbfiles: nzbFiles.map((file) => JSON.parse(JSON.stringify(file))),
              filename,
            })
          }
        }
        const onRemovedWindowListener = (winId: number) => handleWindowClose(winId)
        browser.runtime.onConnect.addListener(onConnectListener)
        browser.windows.onRemoved.addListener(onRemovedWindowListener)
      })
      .catch((error) => {
        log.error('Failed to open NZB dialog window:', error)
        reject(error)
      })
  })
}

import { PublicPath } from 'wxt/browser'

import { TargetSettings } from '../settings'

import { Settings } from './settings'

import { browser, Browser, i18n } from '#imports'
import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { Semaphore } from '@/utils/generalUtilities'

const MAX_CONCURRENT = 5

const dlSemaphore = new Semaphore(MAX_CONCURRENT)

const activeDownloads = new Map<
  number,
  {
    nzbFile: NZBFileObject
    resolve: () => void
    reject: (e: Error) => void
  }
>()

const pendingCreatedFilenames = new Map<number, string>()

export const push = async (nzbFile: NZBFileObject, targetSettings: TargetSettings): Promise<void> => {
  const release = await dlSemaphore.acquire()
  try {
    if (!browser.downloads.onChanged.hasListener(globalOnChanged)) {
      browser.downloads.onChanged.addListener(globalOnChanged)
    }
    if (!browser.downloads.onCreated.hasListener(globalOnCreated)) {
      browser.downloads.onCreated.addListener(globalOnCreated)
    }
    const downloadInstance = new download(nzbFile, targetSettings)
    try {
      await downloadInstance.push()
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      log.error(`error while downloading file "${nzbFile.title}"`, error)
      throw error
    }
  } finally {
    release()
  }
}

export const testConnection = async (targetSettings: TargetSettings): Promise<boolean> => {
  log.info(`testing connection to ${targetSettings.name}`)
  try {
    throw new Error(i18n.t('errors.notImplemented'))
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`error while testing connection to ${targetSettings.name}: ${error.message}`)
    throw error
  }
}

export const getCategories = async (targetSettings: TargetSettings): Promise<string[]> => {
  log.info(`getting the categories from ${targetSettings.name}`)
  try {
    throw new Error('not implemented')
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`error while getting the categories from ${targetSettings.name}`, error)
    throw error
  }
}

class download {
  nzbFile: NZBFileObject
  targetSettings: TargetSettings & { settings: Settings; selectedCategory?: string }
  filename: string
  downloadID: number

  constructor(nzbFile: NZBFileObject, targetSettings: TargetSettings) {
    this.nzbFile = nzbFile
    this.targetSettings = targetSettings as TargetSettings & { settings: Settings; selectedCategory?: string }
    this.filename = this.nzbFile.filepath = this.getFilename()
    this.downloadID = -1
  }

  push = async (): Promise<void> => {
    // set category as meta information if it is set
    if (this.targetSettings.selectedCategory && this.nzbFile.settings?.addCategory) {
      this.nzbFile.addMetaInformation('category', this.targetSettings.selectedCategory)
    }

    log.info(`initiating the download for "${this.filename}"`)

    // Create URL
    const blob = new Blob([this.nzbFile.getAsTextFile()], { type: 'application/x-nzb' })
    const url = await getBlobUrl(blob)

    const downloadOptions: Browser.downloads.DownloadOptions = {
      filename: this.filename,
      saveAs: this.targetSettings.settings.saveAs,
      conflictAction: 'uniquify',
      url,
    }

    await new Promise<void>((resolve, reject) => {
      browser.downloads
        .download(downloadOptions)
        .then((id) => {
          if (typeof id === 'undefined') {
            log.info(`failed to initiate the download for "${downloadOptions.filename}"`)
            if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url)
            const err = browser.runtime.lastError
              ? new Error(browser.runtime.lastError.message)
              : new Error('unknown error')
            reject(err)
            return
          }
          this.downloadID = id
          activeDownloads.set(id, {
            nzbFile: this.nzbFile,
            resolve: () => {
              if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url)
              resolve()
            },
            reject: (e) => {
              if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url)
              reject(e)
            },
          })
          // Apply pending filename if onCreated fired earlier
          const pending = pendingCreatedFilenames.get(id)
          if (pending) {
            this.nzbFile.filepath = pending
            pendingCreatedFilenames.delete(id)
          }
        })
        .catch((e) => {
          if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url)
          reject(e instanceof Error ? e : new Error(String(e)))
        })
    })
  }

  getFilename = () => {
    let filename = ''
    if (this.targetSettings.settings.defaultPath !== '') {
      filename += this.targetSettings.settings.defaultPath.replace(/^[/]*(.*)[/]*$/, '$1') + '/'
    }
    if (
      this.targetSettings.categories.useCategories &&
      typeof this.targetSettings.selectedCategory === 'string' &&
      this.targetSettings.selectedCategory !== ''
    ) {
      // sanitize category
      filename += this.targetSettings.selectedCategory.replace(/[/\\?%*:|"<>\r\n\t\0\v\f\u200B]/g, '') + '/'
    }
    // filename is already sanitized
    if (this.nzbFile.settings?.addPasswordToFilename) {
      filename += this.nzbFile.getFilenameWithPassword()
    } else {
      filename += this.nzbFile.getFilename()
    }
    log.info('filename is set to' + ': ' + filename)
    return filename
  }
}

function globalOnCreated(item: Browser.downloads.DownloadItem): void {
  if (item.id == null) return
  if (activeDownloads.has(item.id)) {
    if (item.filename) {
      activeDownloads.get(item.id)!.nzbFile.filepath = item.filename
    }
  } else if (item.filename) {
    // Store for later if push() has not yet registered the download
    pendingCreatedFilenames.set(item.id, item.filename)
  }
}

function globalOnChanged(delta: Browser.downloads.DownloadDelta): void {
  const entry = activeDownloads.get(delta.id)
  if (!entry) return
  if (delta.filename?.current) {
    entry.nzbFile.filepath = delta.filename.current
  }
  if (delta.state?.current) {
    if (delta.state.current === 'complete') {
      activeDownloads.delete(delta.id)
      entry.resolve()
    } else if (delta.state.current === 'interrupted') {
      const msg = delta.error?.current?.match(/^user/i)
        ? 'download was canceled by the user'
        : delta.error?.current?.match(/^file/i)
          ? 'error while saving the NZB file to disk'
          : 'unknown error'
      activeDownloads.delete(delta.id)
      entry.reject(new Error(msg))
    }
  }
}

async function getBlobUrl(blob: Blob): Promise<string> {
  // For Firefox simply use URL.createObjectURL
  if (import.meta.env.FIREFOX) {
    return URL.createObjectURL(blob)
  }
  // URL.createObjectURL is not supported in MV3 service worker in Chrome
  // We therefore need to use offscreen document to create the blob URL
  const offscreenUrl = browser.runtime.getURL('offscreen.html' as PublicPath)
  try {
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      // @ts-expect-error 'BLOBS' is not assignable to type Reason
      reasons: ['BLOBS'],
      justification: 'MV3 requirement',
    })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    if (!err.message.startsWith('Only a single offscreen')) throw err
  }
  // @ts-expect-error clients is not defined
  const client = (await clients.matchAll({ includeUncontrolled: true })).find((client) => client.url === offscreenUrl)
  const messageChannel = new MessageChannel()
  client.postMessage(blob, [messageChannel.port2])
  const response = await new Promise<MessageEvent>((callBack) => (messageChannel.port1.onmessage = callBack))
  return response.data as string
}

import { TargetSettings } from '../settings'

import { Settings } from './settings'

import { browser, Browser, i18n } from '#imports'
import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { b64EncodeUnicode } from '@/utils/stringUtilities'

export const push = async (nzbFile: NZBFileObject, targetSettings: TargetSettings): Promise<void> => {
  const downloadInstance = new download(nzbFile, targetSettings)
  try {
    await downloadInstance.push()
  } catch (e) {
    const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
    log.error(`error while downloading file "${nzbFile.title}"`, error)
    throw error
  }
}

export const testConnection = async (targetSettings: TargetSettings): Promise<boolean> => {
  log.info(`testing connection to ${targetSettings.name}`)
  try {
    throw new Error(i18n.t('errors.notImplemented'))
  } catch (e) {
    const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
    log.error(`error while testing connection to ${targetSettings.name}: ${error.message}`)
    throw e
  }
}

export const getCategories = async (targetSettings: TargetSettings): Promise<string[]> => {
  log.info(`getting the categories from ${targetSettings.name}`)
  try {
    throw new Error('not implemented')
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`error while getting the categories from ${targetSettings.name}`, error)
    throw e
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
    this.filename = this.getFilename()
    this.downloadID = -1
  }

  push = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const onCreatedListener = (details: Browser.downloads.DownloadItem): void => {
        if (details.filename) {
          this.nzbFile.filepath = details.filename
          browser.downloads.onCreated.removeListener(onCreatedListener)
        }
      }

      const onChangeListener = (details: Browser.downloads.DownloadDelta): void => {
        if (details.id !== this.downloadID) {
          return
        }
        if (details.filename?.current) {
          this.nzbFile.filepath = details.filename.current
        } else if (details.state?.current) {
          browser.downloads.onChanged.removeListener(onChangeListener)
          if (details.state.current === 'complete') {
            resolve()
          } else if (details.state.current === 'interrupted') {
            if (details.error?.current) {
              if (details.error.current.match(/^user/i)) {
                reject(new Error('download was canceled by the user'))
              } else if (details.error.current.match(/^file/i)) {
                reject(new Error('error while saving the NZB file to disk'))
              } else {
                reject(new Error('unknown error'))
              }
            }
          }
        }
      }

      log.info(`initiating the download for "${this.filename}"`)
      let url: string
      const clonedNZBFile = Object.assign(new NZBFileObject(), this.nzbFile)
      if (this.targetSettings.selectedCategory && clonedNZBFile.settings?.addCategory) {
        clonedNZBFile.addMetaInformation('category', this.targetSettings.selectedCategory)
      }
      if (import.meta.env.FIREFOX) {
        const blob = new Blob([clonedNZBFile.getAsTextFile()], { type: 'data:text/nzb;base64' })
        url = URL.createObjectURL(blob)
      } else {
        url = 'data:text/nzb;base64,' + b64EncodeUnicode(clonedNZBFile.getAsTextFile())
      }
      const downloadOptions: Browser.downloads.DownloadOptions = {
        filename: this.filename,
        saveAs: this.targetSettings.settings.saveAs,
        conflictAction: 'uniquify',
        url: url,
      }
      browser.downloads.onCreated.addListener(onCreatedListener)
      browser.downloads.onChanged.addListener(onChangeListener)
      browser.downloads.download(downloadOptions).then((id) => {
        this.downloadID = id
        if (typeof id === 'undefined') {
          log.info(`failed to initiate the download for "${downloadOptions.filename}"`)
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError)
          } else {
            reject(new Error('unknown error'))
          }
        } else {
          log.info(`initiated the download for "${downloadOptions.filename}"`)
          return true
        }
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

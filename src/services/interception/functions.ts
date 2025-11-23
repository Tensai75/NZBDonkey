import { PublicPath } from 'wxt/browser'

import { ArchiveReader, libarchiveWasm } from './libarchive-wasm'
import { DomainSettings, get as getSettings } from './settings'

import { Browser, i18n } from '#imports'
import { getCategory } from '@/services/categories'
import log from '@/services/logger/debugLogger'
import notifications from '@/services/notifications'
import { NZBFileObject, showNzbFileDialog } from '@/services/nzbfile'
import { DeserializedResponse } from '@/utils/fetchUtilities'
import { getExtensionFromFilename, getFileNameFromPath } from '@/utils/stringUtilities'

export async function extractArchive(blob: Blob, source: string): Promise<NZBFileObject[]> {
  const data = await blob.arrayBuffer()
  const path = '/libarchive.wasm'
  const mod = await libarchiveWasm({
    locateFile() {
      return browser.runtime.getURL(path as PublicPath)
    },
  })
  const reader = new ArchiveReader(mod, new Int8Array(data))
  const nzbFiles: NZBFileObject[] = []
  for (const entry of reader.entries()) {
    const pathname = entry.getPathname()
    if (pathname.toLowerCase().endsWith('.nzb')) {
      try {
        const nzbTextfile = new TextDecoder().decode(entry.readData())
        const nzbfile = await new NZBFileObject().init()
        await nzbfile.addNzbFile(nzbTextfile, getFileNameFromPath(pathname), source)
        nzbFiles.push(nzbfile)
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e))
        log.warn('error while extracting the NZB file', error)
      }
    }
  }
  reader.free()
  return nzbFiles
}

export async function getActiveDomains(): Promise<DomainSettings[]> {
  const settings = await getSettings()
  return settings.domains.filter((domain) => domain.isActive)
}

export async function processNzbFiles(nzbFiles: NZBFileObject[], filename: string): Promise<void> {
  if (nzbFiles.length > 1) {
    await handleMultiNzbProcessing(nzbFiles, filename)
  } else {
    nzbFiles[0].process()
  }
}

export async function handleResponseData({
  response,
  filename,
  source,
  allowedArchives = ['zip', 'rar', '7z'],
}: {
  response: Response | DeserializedResponse
  filename: string
  source: string
  allowedArchives: string[]
}): Promise<NZBFileObject[]> {
  const extension = getExtensionFromFilename(filename).toLowerCase()
  const nzbFiles: NZBFileObject[] = []
  try {
    if (extension === 'nzb') {
      log.info(`NZB file detected: ${filename}`)
      const nzbFile = await new NZBFileObject().init()
      await nzbFile.addNzbFile(await response.text(), filename, source)
      nzbFiles.push(nzbFile)
    } else if (allowedArchives.includes(extension)) {
      log.info(`Archive file detected: ${filename}`)
      const blob = await response.blob()
      const archiveFiles = await extractArchive(blob, source)
      nzbFiles.push(...archiveFiles)
    } else {
      throw new Error('no NZB file or archive in intercepted response')
    }
    if (!nzbFiles.length) throw new Error('no NZB file found in download')
    return nzbFiles
  } catch (e) {
    downloadFile(response, filename)
    throw e instanceof Error ? e : new Error(String(e))
  }
}

export async function handleNzbDialogIfNeeded(
  nzbFiles: NZBFileObject[],
  filename: string,
  showNzbDialog: boolean
): Promise<void> {
  if (showNzbDialog) {
    const updatedFiles = await showNzbFileDialog(nzbFiles, filename)
    nzbFiles.splice(0, nzbFiles.length, ...updatedFiles) // Update the original array
  }
}

export async function handleMultiNzbProcessing(nzbFiles: NZBFileObject[], filename: string): Promise<void> {
  nzbFiles.map((nzbFile) => (nzbFile.isFromArchive = true))
  await handleMultiNzbCategorySetting(nzbFiles, filename)
  const nzbFilePromises = nzbFiles.map(async (nzbFile) => await nzbFile.process())
  const nzbFileResults = await Promise.allSettled(nzbFilePromises)
  const failed = nzbFileResults.filter((result) => result.status === 'rejected').length
  if (failed === 0) {
    notifications.success(i18n.t('interception.fetchResponseArchiveProcessingSuccess', [filename]))
    return
  } else if (failed > 0 && failed < nzbFileResults.length) {
    notifications.error(i18n.t('interception.fetchResponseArchiveProcessingPartialSuccess', [filename, failed]))
    return
  } else if (failed === nzbFileResults.length) {
    notifications.error(i18n.t('interception.fetchResponseArchiveProcessingError', [filename]))
    return
  }
}

export async function handleMultiNzbCategorySetting(nzbFiles: NZBFileObject[], filename: string): Promise<void> {
  const selectedTargetCategories: string[] = []
  for (let i = 0; i < nzbFiles.length; i++) {
    for (let j = 0; j < nzbFiles[i].targets.length; j++) {
      if (!nzbFiles[i].targets[j].isActive) continue
      if (nzbFiles[i].targets[j].categories.useCategories && nzbFiles[i].targets[j].selectedCategory === undefined) {
        if (selectedTargetCategories[j] !== undefined) {
          nzbFiles[i].targets[j].selectedCategory = selectedTargetCategories[j]
        } else {
          // get the category once for the archive file name
          // assuming that all files in the archive will have the same category
          selectedTargetCategories[j] = await getCategory(nzbFiles[i].targets[j].categories, filename)
          nzbFiles[i].targets[j].selectedCategory = selectedTargetCategories[j]
        }
      }
    }
  }
}

export async function handleError(error: Error, nzbFiles: NZBFileObject[]): Promise<void> {
  nzbFiles.forEach((nzbFile) => {
    nzbFile.status = 'error'
    nzbFile.errorMessage = error.message
    nzbFile.targets.forEach((target) => (target.status = 'inactive'))
    nzbFile.log(nzbFile)
  })
}

async function downloadFile(response: Response | DeserializedResponse, filename: string): Promise<void> {
  try {
    const blob = await response.blob()
    // Create URL (blob for Firefox, data URL for Chrome)
    let url: string
    if (import.meta.env.FIREFOX) {
      url = URL.createObjectURL(blob)
    } else {
      // Chrome: blob: not supported by downloads API in MV3 service worker
      // Use data:; base64 to be safe with any binary chars
      url = `data:${blob.type};base64,${await blobToBase64(blob)}`
    }
    log.info(`downloading file ${filename} via browser download`)
    const downloadOptions: Browser.downloads.DownloadOptions = {
      filename: filename,
      url,
    }
    browser.downloads.download(downloadOptions)
  } catch (e) {
    log.error(`error while downloading file ${filename}`, e instanceof Error ? e : new Error(String(e)))
  }
}

// Helper function for efficient blob to base64 encoding
async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

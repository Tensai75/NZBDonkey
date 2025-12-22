import parseTar from '@vigneshpa/parse-tar'
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
  const startTime = performance.now()
  const data = await blob.arrayBuffer()
  const path = '/libarchive.wasm'
  const mod = await libarchiveWasm({
    locateFile() {
      return browser.runtime.getURL(path as PublicPath)
    },
  })
  const reader = new ArchiveReader(mod, new Int8Array(data))
  const nzbFiles: NZBFileObject[] = []
  const extractPromises: Promise<void>[] = []
  for (const entry of reader.entries()) {
    const pathname = entry.getPathname()
    if (pathname.toLowerCase().endsWith('.nzb')) {
      const promise = new Promise<void>((resolve) => {
        ;(async () => {
          try {
            const nzbTextfile = new TextDecoder().decode(entry.readData())
            const nzbfile = await new NZBFileObject().init()
            nzbfile.addNzbFile(nzbTextfile, getFileNameFromPath(pathname), source)
            nzbFiles.push(nzbfile)
            resolve()
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e))
            log.warn('error while extracting the NZB file', error)
            resolve()
          }
        })()
      })
      extractPromises.push(promise)
    }
  }
  await Promise.allSettled(extractPromises)
  const endTime = performance.now()
  log.info(`extracted ${nzbFiles.length} NZB files from archive in ${(endTime - startTime).toFixed(2)} ms`)
  reader.free()
  return nzbFiles
}

export async function getActiveDomains(): Promise<DomainSettings[]> {
  const settings = await getSettings()
  return settings.enabled ? settings.domains.filter((domain) => domain.isActive) : []
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
  allowedArchives = ['zip', 'rar', '7z', 'tar', 'gz'],
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
    } else if (extension === 'gz' && allowedArchives.includes(extension)) {
      log.info(`Gzip file detected: ${filename}`)
      nzbFiles.push(...(await handleGzFile(await response.blob(), filename, source, allowedArchives)))
    } else if (extension === 'tar' && allowedArchives.includes(extension)) {
      log.info(`Tar file detected: ${filename}`)
      nzbFiles.push(...(await handleTarFile(await response.blob(), source)))
    } else if (['zip', 'rar', '7z'].includes(extension) && allowedArchives.includes(extension)) {
      log.info(`${extension[0].toUpperCase() + extension.slice(1)} file detected: ${filename}`)
      nzbFiles.push(...(await extractArchive(await response.blob(), source)))
    } else {
      throw new Error('no NZB file or archive in intercepted response')
    }
    if (!nzbFiles.length) throw new Error('no NZB file found in download')
    return nzbFiles
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    downloadFile(response, filename)
    throw error
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

// Helper function to decompress gzip blobs
async function decompressBlob(blob: Blob): Promise<Blob> {
  const ds = new DecompressionStream('gzip')
  const decompressedStream = blob.stream().pipeThrough(ds)
  return await new Response(decompressedStream).blob()
}

// Helper function to handle gzip files and extract NZB files
async function handleGzFile(
  blob: Blob,
  filename: string,
  source: string,
  allowedArchives: string[]
): Promise<NZBFileObject[]> {
  try {
    const startTime = performance.now()
    const decompressedBlob = await decompressBlob(blob)
    const endTime = performance.now()
    log.info(`Decompressed gzip file ${filename} in ${(endTime - startTime).toFixed(2)} ms`)
    const decompressedFilename = filename.replace(/\.gz$/i, '')
    const extension = getExtensionFromFilename(decompressedFilename).toLowerCase()
    if (extension === 'nzb') {
      log.info(`Decompressed NZB file detected: ${decompressedFilename}`)
      const nzbFile = await new NZBFileObject().init()
      await nzbFile.addNzbFile(await decompressedBlob.text(), decompressedFilename, source)
      return [nzbFile]
    } else if (extension === 'tar' && allowedArchives.includes(extension)) {
      log.info(`Decompressed tarball detected: ${decompressedFilename}`)
      return await handleTarFile(decompressedBlob, source)
    } else {
      log.info(`Decompressed Gzip file is neither an NZB file nor an allowed archive: ${decompressedFilename}`)
      return []
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    throw new Error(`error while handling gzip file: ${error.message}`)
  }
}

// Helper function to handle tar files and extract NZB files
async function handleTarFile(blob: Blob, source: string): Promise<NZBFileObject[]> {
  try {
    const startTime = performance.now()
    const tarFiles = await parseTar(blob)
    const nzbFiles: NZBFileObject[] = []
    for (const file of tarFiles) {
      const innerFilename = getFileNameFromPath(file.name)
      const innerExtension = getExtensionFromFilename(innerFilename).toLowerCase()
      if (innerExtension === 'nzb') {
        try {
          const fileContent = file.contents
          if (!fileContent) continue
          log.info(`NZB file detected inside tarball: ${innerFilename}`)
          const nzbFile = await new NZBFileObject().init()
          await nzbFile.addNzbFile(await fileContent.text(), innerFilename, source)
          nzbFiles.push(nzbFile)
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e))
          log.warn(`error while extracting the NZB file '${innerFilename}' from tarball`, error)
        }
      }
    }
    const endTime = performance.now()
    log.info(`extracted ${nzbFiles.length} NZB files from tarball in ${(endTime - startTime).toFixed(2)} ms`)
    return nzbFiles
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    throw new Error(`error while handling tar file: ${error.message}`)
  }
}

// Helper function to download a file via browser downloads API
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
    const error = e instanceof Error ? e : new Error(String(e))
    log.error(`error while downloading file ${filename}`, error)
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

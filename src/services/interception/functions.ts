import { PublicPath } from 'wxt/browser'

import { ArchiveReader, libarchiveWasm } from './libarchive-wasm'

import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { getFileNameFromPath } from '@/utils/stringUtilities'

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
        const nzbfile = await new NZBFileObject().init()
        await nzbfile.addNzbFile(new TextDecoder().decode(entry.readData()), getFileNameFromPath(pathname), source)
        nzbFiles.push(nzbfile)
      } catch (e) {
        const error = e instanceof Error ? e : new Error('unknown error')
        log.warn('error while extracting the NZB file', error)
      }
    }
  }
  reader.free()
  return nzbFiles
}

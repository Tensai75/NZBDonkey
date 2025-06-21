import { i18n } from '#imports'
import { DomainSettings, extractArchive, getSettings as getInterceptionSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import notification from '@/services/notifications'
import { NZBFileObject, showNzbFileDialog } from '@/services/nzbfile'
import {
  DeserializedResponse,
  getBaseDomainFromULR,
  getFilenameFromResponse,
  getHttpStatusText,
} from '@/utils/fetchUtilities'
import { getExtensionFromFilename } from '@/utils/stringUtilities'

export async function fetchInterceptedRequest({
  request,
  source,
}: {
  request: Request
  source: string
}): Promise<void> {
  try {
    log.info(`fetching intercepted request from ${request.url}`)
    const response = await fetch(request)
    if (!response.ok) {
      throw new Error(`${response.status} - ${getHttpStatusText(response.status)}`)
    }
    processInterceptedRequestResponse({ response: response, source: source })
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error('error fetching intercepted request', error)
    throw error
  }
}

export async function processInterceptedRequestResponse({
  response,
  source,
}: {
  response: Response | DeserializedResponse
  source: string
}): Promise<void> {
  let nzbFiles: NZBFileObject[] = [] // Initialize nzbFiles here
  const url = response.url
  const domain = getBaseDomainFromULR(url)
  const filename = getFilenameFromResponse(response as Response)
  const setting = (await getInterceptionSettings()).domains.find((d) => d.domain === domain)
  try {
    if (!setting) throw new Error('no interception settings found for this domain')
    log.info(`processing intercepted request response from ${url}`)
    nzbFiles = await handleResponseData({ response, filename, source, setting })
    if (!nzbFiles.length) throw new Error('no NZB file found in download')
    await handleNzbDialogIfNeeded(nzbFiles, filename, setting)
    nzbFiles.forEach((nzbFile) => nzbFile.process())
  } catch (e) {
    const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
    nzbFiles.forEach((nzbFile) => {
      nzbFile.status = 'error'
      nzbFile.errorMessage = error.message
      nzbFile.targets.forEach((target) => (target.status = 'inactive'))
      nzbFile.log(nzbFile)
    })
    log.error('error while processing the intercepted request response', error)
    notification.error(i18n.t('interception.fetchResponseProcessingError', [filename, source, error.message]))
  }
}

async function handleResponseData({
  response,
  filename,
  source,
  setting,
}: {
  response: Response | DeserializedResponse
  filename: string
  source: string
  setting: DomainSettings
}): Promise<NZBFileObject[]> {
  const extension = getExtensionFromFilename(filename).toLowerCase()
  if (extension === 'nzb') {
    log.info(`NZB file detected: ${filename}`)
    const nzbFile = await new NZBFileObject().init()
    await nzbFile.addNzbFile(await response.text(), filename, source)
    return [nzbFile]
  } else if (setting?.archiveFileExtensions.includes(extension)) {
    log.info(`Archive file detected: ${filename}`)
    const blob = await response.blob()
    return extractArchive(blob, source)
  } else {
    throw new Error('no NZB file or archive in intercepted response')
  }
}

async function handleNzbDialogIfNeeded(
  nzbFiles: NZBFileObject[],
  filename: string,
  setting: DomainSettings
): Promise<void> {
  if (setting.showNzbDialog) {
    const updatedFiles = await showNzbFileDialog(nzbFiles, filename)
    nzbFiles.splice(0, nzbFiles.length, ...updatedFiles) // Update the original array
  }
}

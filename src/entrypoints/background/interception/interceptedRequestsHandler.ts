import { i18n } from '#imports'
import {
  getSettings as getInterceptionSettings,
  handleError,
  handleNzbDialogIfNeeded,
  handleResponseData,
  processNzbFiles,
} from '@/services/interception'
import log from '@/services/logger/debugLogger'
import notifications from '@/services/notifications'
import { NZBFileObject } from '@/services/nzbfile'
import {
  DeserializedResponse,
  getBaseDomainFromURL,
  getFilenameFromResponse,
  getHttpStatusText,
} from '@/utils/fetchUtilities'

export async function fetchInterceptedRequest(request: Request): Promise<Response> {
  try {
    log.info(`fetching intercepted request from ${request.url}`)
    const response = await fetch(request)
    if (!response.ok) {
      throw new Error(`${response.status} - ${getHttpStatusText(response.status)}`)
    }
    return response
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
  const domain = getBaseDomainFromURL(url)
  const filename = getFilenameFromResponse(response as Response)
  const setting = (await getInterceptionSettings()).domains.find((d) => d.domain === domain)
  try {
    if (!setting) throw new Error('no interception settings found for this domain')
    log.info(`processing intercepted request response from ${url}`)
    nzbFiles = await handleResponseData({ response, filename, source, allowedArchives: setting.archiveFileExtensions })
    await handleNzbDialogIfNeeded(nzbFiles, filename, setting.showNzbDialog)
    await processNzbFiles(nzbFiles, filename)
  } catch (e) {
    const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
    handleError(error, nzbFiles)
    log.error('error while processing the intercepted request response', error)
    notifications.error(i18n.t('interception.fetchResponseProcessingError', [filename, source, error.message]))
  }
}

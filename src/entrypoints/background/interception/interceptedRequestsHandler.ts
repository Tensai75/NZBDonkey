import { i18n } from '#imports'
import {
  extractArchive,
  getSettings as getInterceptionSettings,
  Settings as InterceptionSettings,
} from '@/services/interception'
import log from '@/services/logger/debugLogger'
import { onMessage } from '@/services/messengers/extensionMessenger'
import { InterceptionRequest, InterceptionRequestResponse } from '@/services/messengers/windowMessenger'
import notification from '@/services/notifications'
import { NZBFileObject, showNzbFileDialog } from '@/services/nzbfile'
import { convertBase64toBlob, convertBlobToBase64, getFilenameFromResponse, useFetch } from '@/utils/fetchUtilities'
import { getExtensionFromFilename } from '@/utils/stringUtilities'

export default function (): void {
  onMessage('interceptedRequest', (message) => {
    fetchInterceptedRequest(message.data)
  })
  onMessage('interceptedRequestResponse', (message) => {
    processInterceptedRequestResponse(message.data)
  })
  onMessage('interceptedRequestFetchError', (message) => {
    notification.error(i18n.t('interception.fetchError', [message.data.url, message.data.error.message]))
  })
}

export async function fetchInterceptedRequest({
  url,
  options,
  domain,
  formData,
  searchParams,
  source,
}: InterceptionRequest): Promise<void> {
  try {
    // Process formData and searchParams into the request body
    options.body = processRequestBody(formData, searchParams)
    const settings = await getInterceptionSettings()
    const setting = settings.domains.find((domainSetting) => domainSetting.domain === domain)
    const response = await useFetch(url, options)
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}${response.statusText ? ' - ' + response.statusText : ''}`)
    }
    const interceptionRequestResponse = await buildInterceptionResponse(response, domain, url, source, setting)
    processInterceptedRequestResponse(interceptionRequestResponse)
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error occurred')
    log.error(`Error fetching intercepted request from ${url}`, error)
    notification.error(i18n.t('interception.fetchError', [url, error.message]))
  }
}

function processRequestBody(formData: string, searchParams: string): BodyInit | undefined {
  if (formData) {
    const form = new FormData()
    new URLSearchParams(formData).forEach((value, key) => form.append(key, value))
    return form
  }
  if (searchParams) {
    return new URLSearchParams(searchParams)
  }
  return undefined
}

async function buildInterceptionResponse(
  response: Response,
  domain: string,
  url: string,
  source: string,
  setting: InterceptionSettings['domains'][number] | undefined
): Promise<InterceptionRequestResponse> {
  const filename = getFilenameFromResponse(response)
  const extension = getExtensionFromFilename(filename).toLowerCase()
  const interceptionRequestResponse: InterceptionRequestResponse = {
    filename,
    type: response.headers.get('Content-Type'),
    text: undefined,
    blob: undefined,
    domain,
    url,
    source,
  }
  if (extension === 'nzb') {
    interceptionRequestResponse.text = await response.text()
  } else if (setting?.archiveFileExtensions.includes(extension)) {
    interceptionRequestResponse.blob = await convertBlobToBase64(await response.blob())
  } else {
    throw new Error('No NZB file or archive in intercepted response')
  }
  return interceptionRequestResponse
}

async function processInterceptedRequestResponse(response: InterceptionRequestResponse): Promise<void> {
  let nzbFiles: NZBFileObject[] = [] // Initialize nzbFiles here
  try {
    log.info('Background script received an intercepted request response')
    nzbFiles = await handleResponseData(response)
    if (!nzbFiles.length) throw new Error('No NZB file found in download')
    await handleNzbDialogIfNeeded(nzbFiles, response.filename, response.domain)
    nzbFiles.forEach((nzbFile) => nzbFile.process())
  } catch (e) {
    const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
    handleProcessingError(nzbFiles, error, response) // Pass the actual nzbFiles array here
  }
}

async function handleResponseData(response: InterceptionRequestResponse): Promise<NZBFileObject[]> {
  if (response.blob) {
    const responseBlob = await convertBase64toBlob(response.blob)
    return extractArchive(responseBlob, response.source)
  }
  if (response.text) {
    const nzbFile = await new NZBFileObject().init()
    await nzbFile.addNzbFile(response.text, response.filename, response.source)
    return [nzbFile]
  }
  throw new Error('No valid response')
}

async function handleNzbDialogIfNeeded(nzbFiles: NZBFileObject[], filename: string, domain: string): Promise<void> {
  const interceptionSettings = await getInterceptionSettings()
  const domainSettings = interceptionSettings.domains.find((d) => d.domain === domain)
  if (domainSettings?.showNzbDialog) {
    const updatedFiles = await showNzbFileDialog(nzbFiles, filename)
    nzbFiles.splice(0, nzbFiles.length, ...updatedFiles) // Update the original array
  }
}

function handleProcessingError(nzbFiles: NZBFileObject[], error: Error, response: InterceptionRequestResponse): void {
  nzbFiles.forEach((nzbFile) => {
    nzbFile.status = 'error'
    nzbFile.errorMessage = error.message
    nzbFile.targets.forEach((target) => (target.status = 'inactive'))
    nzbFile.log(nzbFile)
  })
  log.error('Error while processing the intercepted request response', error)
  notification.error(
    i18n.t('interception.fetchResponseProcessingError', [response.filename, response.url, error.message])
  )
}

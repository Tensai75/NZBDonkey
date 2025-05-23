import { defineWindowMessaging } from '@webext-core/messaging/page'

import { defineUnlistedScript } from '#imports'
import { DomainSettings } from '@/services/interception'
import { DebugLogProtocolMap, IDebugLog } from '@/services/logger/loggerDB'
import { InterceptionRequestResponse, websiteMessenger } from '@/services/messengers/windowMessenger'
import {
  convertBlobToBase64,
  getBaseDomainFromULR,
  getFilenameFromResponse,
  getRelativeURL,
} from '@/utils/fetchUtilities'
import { getExtensionFromFilename } from '@/utils/stringUtilities'

export default defineUnlistedScript(() => {
  const debugMessenger = defineWindowMessaging<DebugLogProtocolMap>({ namespace: 'nzbdonkey' })
  const log = {
    info: (text: string) => sendMessage('info', text, undefined),
    warn: (text: string, error?: Error) => sendMessage('warn', text, error ?? undefined),
    error: (text: string, error?: Error) => sendMessage('error', text, error ?? undefined),
  }
  const sendMessage = (
    type: 'info' | 'warn' | 'error',
    text: string,
    error: Error | undefined = undefined,
    date: number = Date.now()
  ): void => {
    const message: IDebugLog = {
      type: type,
      date: date,
      text: text,
      source: 'interception-injection',
      error: error ? error.message : '',
    }
    console[message.type](
      `[NZBDonkey] ${message.text.charAt(0).toUpperCase() + message.text.slice(1)}`,
      message.error ?? ''
    )
    debugMessenger.sendMessage('debbugLoggerLog', message)
  }

  type InterceptionSource = 'click' | 'submit' | 'xhr' | 'fetch' | 'location'
  type RecentRequestInfo = {
    timestamp: number
    source: InterceptionSource
  }
  const recentUrls = new Map<string, RecentRequestInfo>()
  const priority: Record<InterceptionSource, number> = {
    click: 1,
    submit: 2,
    xhr: 3,
    location: 4,
    fetch: 5,
  }

  log.info('interception injection script loaded')
  let setting: DomainSettings
  const baseDomain: string = getBaseDomainFromULR(window.location.href)
  const originalXHRopen = XMLHttpRequest.prototype.open
  const originalXHRsend = XMLHttpRequest.prototype.send
  const originalFetch = window.fetch

  // make a request for the domain setting
  log.info('requesting domain settings for ' + baseDomain)
  websiteMessenger.sendMessage('getDomainSetting', baseDomain)

  // listen to the response
  websiteMessenger.onMessage('domainSetting', (message) => {
    if (message.data && message.data.domain === baseDomain) {
      log.info('domain settings received for ' + message.data.domain)
      setHandler(message.data)
      log.info('interception injection script loaded successfully')
    } else {
      log.warn(`wrong domain settings received (${message.data?.domain} instead of ${baseDomain})`)
    }
  })

  function setHandler(domainSettings: DomainSettings) {
    setting = domainSettings
    // handles javascript fetch
    window.fetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
      const targetUrl = new URL(url instanceof Request ? url.url : url.toString(), window.location.href).href
      if (testTargetUrl(targetUrl)) {
        log.info('intercepting fetch request for ' + targetUrl)
        let rewrittenUrl: RequestInfo
        if (url instanceof Request) {
          rewrittenUrl = new Request(targetUrl, {
            method: url.method,
            headers: url.headers,
            body: url.bodyUsed ? undefined : url.body,
            mode: url.mode,
            credentials: url.credentials,
            cache: url.cache,
            redirect: url.redirect,
            referrer: url.referrer,
            integrity: url.integrity,
            keepalive: url.keepalive,
            signal: url.signal,
          })
        } else {
          rewrittenUrl = targetUrl
        }
        void fetchUrl(rewrittenUrl, options ?? {}, 'fetch')
        // return non-resolving promise to block original fetch request
        return new Promise(() => {})
      }
      return originalFetch(url, options ?? {})
    }
    // handles javascript XHR
    interface CustomXMLHttpRequest extends XMLHttpRequest {
      _method?: string
      _url?: string
      _username?: string
      _password?: string
      _isBlocked?: boolean
    }
    window.XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      const targetUrl = new URL(url, window.location.href).toString()
      if (testTargetUrl(targetUrl)) {
        log.info('intercepting XHR.open() for: ' + targetUrl)
        const xhr = this as CustomXMLHttpRequest
        xhr._method = method
        xhr._url = targetUrl
        xhr._username = username ?? ''
        xhr._password = password ?? ''
        xhr._isBlocked = true
      }
      originalXHRopen.call(this, method, url, async, username, password)
    }
    window.XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
      const xhr = this as CustomXMLHttpRequest
      if (xhr._isBlocked) {
        log.info('intercepting XHR.send() for: ' + xhr._url)
        // Create an exact copy of the XHR request as RequestInfo and RequestInit
        const requestInfo: RequestInfo = xhr._url ?? ''
        const requestInit: RequestInit = {
          method: xhr._method,
          headers: {},
          body: body instanceof Document ? new XMLSerializer().serializeToString(body) : (body ?? undefined),
        }
        // If username is set, add basic auth header
        if (xhr._username != '') {
          ;(requestInit.headers as Record<string, string>)['Authorization'] =
            'Basic ' + btoa(`${xhr._username}:${xhr._password ?? ''}`)
        }
        void fetchUrl(requestInfo, requestInit, 'xhr')
        // original request is not happening because we dont call .send()
      } else {
        originalXHRsend.call(this, body)
      }
    }
    // handles javascript submit which does not fire the submit event
    window.HTMLFormElement.prototype.submit = function () {
      window.HTMLFormElement.prototype.requestSubmit.call(this)
    }
    // handles html submit
    document.body.addEventListener('submit', submitListener, true)
    // handles click
    document.body.addEventListener('click', clickListener, true)
    // handles window.location change but only works with Chrome
    if (import.meta.env.CHROME) {
      // @ts-expect-error ts(2339) // TypeScript does not recognize the 'navigation' property on window
      navigation.addEventListener('navigate', (event: NavigateEvent) => {
        const targetUrl: string = new URL(event.destination.url, window.location.href).href
        if (testTargetUrl(targetUrl)) {
          log.info('intercepting location change for ' + targetUrl)
          event.preventDefault()
          fetchUrl(targetUrl, {}, 'location')
        }
      })
    }
  }

  function submitListener(event: SubmitEvent): void {
    try {
      const target = event.target as HTMLFormElement
      let url = new URL(target.action, window.location.href).href
      if (testTargetUrl(url)) {
        log.info('intercepting submit event for: ' + url)
        event.preventDefault()
        const options: RequestInit = {
          method: target.method.toUpperCase(),
        }
        const formData = new FormData(target)
        const formEntries = [...formData.entries()] // Spread form entries into array
        if (formEntries.length > 0) {
          switch (target.method.toUpperCase()) {
            case 'POST':
              if (setting.postDataHandling === 'sendAsFormData') {
                options.body = formData
              } else {
                // Default: send as URLSearchParams
                options.body = new URLSearchParams(formEntries.map(([key, value]) => [key, value.toString()]))
              }
              break
            default: // GET
              url += '?' + new URLSearchParams(formEntries.map(([key, value]) => [key, value.toString()])).toString()
          }
        }
        fetchUrl(url, options, 'submit')
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during form submission')
      log.error('submit handler error', error)
    }
  }

  function clickListener(event: MouseEvent): void {
    try {
      const target = (event.target as HTMLElement)?.closest('a[href]') as HTMLAnchorElement | null
      if (target && target.href) {
        const url = new URL(target.href, window.location.href).href
        if (testTargetUrl(url)) {
          event.preventDefault()
          log.info(`Intercepting click event for: ${url}`)
          fetchUrl(url, {}, 'click')
        }
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during click event')
      log.error('click handler error', error)
    }
  }

  function testTargetUrl(url: string | null | undefined): boolean {
    if (!url) return false
    const path = url.startsWith('/') ? url : getRelativeURL(url)
    const regexp = setting?.pathRegExp ? new RegExp(setting.pathRegExp, 'i') : null
    return !!(path && regexp?.test(path))
  }

  function fetchUrl(request: RequestInfo, options: RequestInit, source: InterceptionSource): void {
    const timeWindowMs = 500
    const now = Date.now()
    const url = typeof request === 'string' ? request : request.url
    const lastRequest = recentUrls.get(url)

    // Skip if a same or higher-priority request was recently made
    if (lastRequest && now - lastRequest.timestamp < timeWindowMs) {
      if (priority[source] <= priority[lastRequest.source]) {
        return
      }
    }

    // Register current request
    recentUrls.set(url, { timestamp: now, source })

    const runRequest = () => {
      const current = recentUrls.get(url)
      if (!current || current.timestamp !== now || current.source !== source) {
        return // Aborted due to newer or higher-priority request
      }
      log.info(`fetching intercepted request from ${url} [${source}]`)
      // Default method if missing or unsupported
      const method = options.method?.toUpperCase()
      if (method !== 'POST' && method !== 'GET') {
        options.method = 'GET'
      }
      options.credentials = 'include'
      if (setting.fetchOrigin === 'background') {
        sendRequestToBackground(options, url)
      } else {
        originalFetch(url, options)
          .then(async (response: Response) => {
            if (!response.ok) {
              throw new Error(`HTTP error: ${response.status}${response.statusText ? ' - ' + response.statusText : ''}`)
            }
            const interceptionRequestResponse: InterceptionRequestResponse = {
              filename: getFilenameFromResponse(response),
              type: response.headers.get('Content-Type'),
              text: undefined,
              blob: undefined,
              domain: baseDomain,
              url: url,
              source: window.location.href,
            }
            const extension = getExtensionFromFilename(interceptionRequestResponse.filename).toLowerCase()
            if (extension === 'nzb') {
              interceptionRequestResponse.text = await response.text()
            } else if (setting.archiveFileExtensions.includes(extension)) {
              interceptionRequestResponse.blob = await convertBlobToBase64(await response.blob())
            } else {
              throw new Error('no nzb file or archive in intercepted response')
            }
            log.info('sending intercepted request response to content script')
            websiteMessenger.sendMessage('interceptedRequestResponse', interceptionRequestResponse)
          })
          .catch((e: Error) => {
            log.error('error when fetching intercepted request from ' + url, e)
            websiteMessenger.sendMessage('interceptedRequestFetchError', { url: url, domain: baseDomain, error: e })
          })
      }
      // Cleanup
      setTimeout(() => {
        const entry = recentUrls.get(url)
        if (entry?.timestamp === now && entry.source === source) {
          recentUrls.delete(url)
        }
      }, timeWindowMs + 10)
    }
    // Delay lower-priority requests to give higher ones a chance to override
    if (priority[source] < priority['fetch']) {
      setTimeout(runRequest, 30)
    } else {
      runRequest()
    }
  }

  function sendRequestToBackground(options: RequestInit, url: string): void {
    log.info('sending intercepted request to background script')
    let formData: string = ''
    if (options.body instanceof FormData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formData = new URLSearchParams(options.body as any).toString()
      delete options.body // remove FormData from options
    }
    let searchParams: string = ''
    if (options.body instanceof URLSearchParams) {
      searchParams = options.body.toString()
      delete options.body // remove URLSearchParams from options
    }
    websiteMessenger.sendMessage('interceptedRequest', {
      url,
      options,
      formData: formData,
      searchParams: searchParams,
      domain: baseDomain,
      source: window.location.href,
    })
  }
  log.info('interception injection script loaded')
})

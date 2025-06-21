import { b64EncodeUnicode, getFileNameFromPath } from '@/utils/stringUtilities'

const DEFAULT_HEADER = { 'X-NZBDonkey': 'true' }
const DEFAULT_TIMEOUT = 30000

/**
 * FetchOptions
 *
 * Defines the options for configuring a fetch request, including URL construction,
 * authentication, headers, and timeout handling.
 *
 * @property {string} [url] - The base URL for the fetch request.
 * @property {string} [scheme] - The scheme (protocol) for the URL (e.g., "http", "https").
 * @property {string} [username] - The username for basic authentication.
 * @property {string} [password] - The password for basic authentication.
 * @property {string} [host] - The hostname for the URL (e.g., "example.com").
 * @property {string} [port] - The port number for the URL (e.g., "8080").
 * @property {string} [basepath] - The base path for the URL (e.g., "/api").
 * @property {string} [path] - The additional path to append to the base path (e.g., "/v1/resource").
 * @property {object} [parameters] - Query parameters as key-value pairs. Arrays are supported.
 * @property {object} [headers] - Additional headers for the fetch request.
 * @property {RequestInit} [init] - Additional options extending the native `RequestInit`.
 * @property {RequestInit['body']} [data] - The body of a POST request (e.g., FormData or JSON).
 * @property {number} [timeout=30000] - Timeout for the fetch request in milliseconds.
 * @property {'text'|'blob'} [responseType] - Expected response type (e.g., "text" or "blob").
 */
export type FetchOptions = {
  url?: string
  scheme?: string
  username?: string
  password?: string
  host?: string
  port?: string
  basepath?: string
  path?: string
  parameters?: { [key: string]: unknown }
  headers?: { [key: string]: string }
  init?: RequestInit
  data?: RequestInit['body']
  timeout?: number
  responseType?: 'text' | 'blob'
}

/**
 * Creates a fetch request with additional features like timeout handling and URL construction.
 * @param {FetchOptions|URL} requestOptions - Options for the fetch request or a URL object.
 * @param {RequestInit} [requestInit={}] - Additional options for the fetch request.
 * @return {Promise<Response>} Resolves to the `Response` object.
 * @throws {Error} Throws an error if the request fails or times out.
 */
export const useFetch = async (
  requestOptions: FetchOptions | string | URL,
  requestInit: RequestInit = {}
): Promise<Response> => {
  const urlOptions: FetchOptions | string = requestOptions instanceof URL ? requestOptions.href : requestOptions
  const options: FetchOptions | null = typeof urlOptions === 'string' ? null : (urlOptions as FetchOptions)

  const url = createURL(urlOptions)
  const init: RequestInit = {
    method: options?.data ? 'POST' : 'GET',
    credentials: 'omit' as RequestCredentials,
    headers: new Headers({
      ...DEFAULT_HEADER,
      ...options?.headers,
    }),
    ...(options?.init ?? {}),
    ...requestInit,
  }

  if (options?.username) {
    const authHeader = b64EncodeUnicode(`${options.username}:${options.password}`)
    if (init.headers instanceof Headers) {
      init.headers?.append('Authorization', `Basic ${authHeader}`)
    }
  }

  if (options?.data) {
    init.body = options.data
  }

  const timeout = options?.timeout ?? DEFAULT_TIMEOUT

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    const response = await fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeoutId))
    if (!response.ok) {
      throw new Error(`${response.status}${response.statusText ? ` - ${response.statusText}` : ''}`)
    }
    return response
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('the request timed out')
      } else {
        throw new Error(`the request failed: ${error.message ?? 'unknown error'}`)
      }
    }
    throw new Error(`the request failed: unknown error`)
  }
}

/**
 * Constructs a fully qualified URL or validates a given URL string.
 * @param {FetchOptions|string} options - URL string or object with URL components.
 * @return {string} The constructed or validated URL.
 * @throws {Error} Throws an error if the URL is invalid.
 */
export const createURL = (options: FetchOptions | string): string => {
  if (typeof options === 'string') {
    try {
      return new URL(options).href
    } catch {
      throw new Error('invalid URL')
    }
  }
  let url: URL
  if (options.url) {
    try {
      url = new URL(options.url)
    } catch {
      throw new Error('invalid URL')
    }
  } else {
    url = new URL('http://localhost')
  }
  if (options.host) {
    url.hostname = options.host.replace(/^(?:.*?:\/\/)?([^/:]+)/i, '$1')
  }
  if (options.port && !isNaN(Number(options.port))) {
    url.port = options.port
  }
  if (options.basepath) {
    url.pathname = options.basepath.replace(/^\/+|\/+$/g, '')
  }
  if (options.path) {
    url.pathname += url.pathname.endsWith('/') ? '' : '/'
    url.pathname += options.path.replace(/^\/+|\/+$/g, '')
  }
  if (options.parameters) {
    const queryParams: string[] = []
    Object.entries(options.parameters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`))
      } else {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
      }
    })
    url.search = queryParams.join('&')
  }
  if (options.scheme) {
    const scheme = options.scheme.match(/[a-z\d-]+/i)?.[0]
    if (scheme) url.protocol = scheme.toLowerCase()
  }
  return url.href
}

/**
 * Creates a FormData object from a given data object.
 * @param {Record<string, string | number | boolean | Blob | [Blob, string] | (string | number | boolean | Blob)[]>} data - The data object to convert.
 * @return {FormData} The resulting FormData object.
 * @throws {Error} Throws an error if the data is invalid.
 */
export const generateFormData = (
  data: Record<string, string | number | boolean | Blob | [Blob, string] | (string | number | boolean | Blob)[]>
): FormData => {
  const formData = new FormData()
  if (data == null) {
    return formData
  }
  if (typeof data !== 'object') {
    throw new Error('invalid form data')
  }
  const addValue = (key: string, value: string | number | boolean | Blob) => {
    if (value == null) {
      return
    } else if (['string', 'number', 'boolean'].includes(typeof value)) {
      formData.append(key, String(value))
    } else if (value instanceof Blob) {
      formData.append(key, value)
    } else {
      throw new Error(`invalid value for key "${key}" in form data`)
    }
  }
  for (const key in data) {
    const value = data[key]
    if (Array.isArray(value)) {
      if (value.length === 2 && value[0] instanceof Blob && typeof value[1] === 'string') {
        formData.append(key, value[0], value[1])
      } else {
        value.forEach((item) => addValue(key, item))
      }
    } else {
      addValue(key, value)
    }
  }
  return formData
}

/**
 * Extracts the filename from the `Content-Disposition` header or the response URL.
 * @param {Response} response - The response object.
 * @return {string} The extracted filename.
 */
export const getFilenameFromResponse = (response: Response): string => {
  const contentDisposition = response.headers.get('Content-Disposition')
  const match = contentDisposition?.match(/filename\*?=(?:[^']*'')?"?([^"]*)"?/i)
  return match?.[1] || getFileNameFromPath(response.url)
}

/**
 * Extracts the base domain from a URL string.
 * @param {string} url - The URL string.
 * @return {string} The base domain.
 * @throws {Error} Throws an error if the URL is invalid.
 */
export const getBaseDomainFromULR = (url: string): string => {
  return new URL(url).hostname.split('.').slice(-2).join('.')
}

/**
 * Extracts the pathname from a URL string.
 * @param {string} url - The URL string.
 * @return {string} The pathname.
 * @throws {Error} Throws an error if the URL is invalid.
 */
export const getPathFromURL = (url: string): string => {
  try {
    return new URL(url).pathname || ''
  } catch {
    throw new Error('Invalid URL')
  }
}

/**
 * Extracts the relative URL (pathname and query string) from an absolute URL.
 * @param {string} absoluteUrl - The absolute URL as a string.
 * @return {string} The relative URL.
 * @throws {Error} Throws an error if the URL is invalid.
 */
export const getRelativeURL = (absoluteUrl: string): string => {
  try {
    const url = new URL(absoluteUrl)
    return url.pathname + url.search // Combine pathname and query string
  } catch {
    throw new Error('Invalid URL')
  }
}

/**
 * Converts a `Blob` object into a Base64-encoded string.
 * @param {Blob} blob - The `Blob` object to convert.
 * @return {Promise<string>} A promise resolving to the Base64 string.
 * @throws {Error} Throws an error if the conversion fails.
 */
export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('failed to convert Blob to Base64'))
  })
}

/**
 * Converts a Base64-encoded data URL into a `Blob` object.
 * @param {string} dataUrl - The Base64 data URL.
 * @return {Promise<Blob>} A promise resolving to the `Blob` object.
 * @throws {Error} Throws an error if the conversion fails.
 */
export const convertBase64toBlob = async (dataUrl: string): Promise<Blob> => {
  try {
    const response = await fetch(dataUrl)
    return response.blob()
  } catch {
    throw new Error('failed to convert Base64 to Blob')
  }
}

/**
 * Safely parses a JSON string into an object.
 * @template T - The expected type of the parsed object.
 * @param {string} string - The JSON string to parse.
 * @return {T} The parsed object.
 * @throws {Error} Throws an error if the string is not valid JSON.
 */
export const JSONparse = <T>(string: string): T => {
  try {
    return JSON.parse(string)
  } catch {
    throw new Error('no valid JSON response')
  }
}

/**
 * SerializedRequest
 *
 * Represents a plain-object serialization of a Request, including method,
 * headers, body, and all relevant fetch options.
 */
export type SerializedRequest = {
  url: string
  method: string
  headers: [string, string][]
  body?: {
    type: 'text' | 'json' | 'urlSearchParams' | 'formData' | 'blob'
    content: string
    mimeType?: string
  }
  credentials: RequestCredentials
  cache: RequestCache
  mode: RequestMode
  redirect: RequestRedirect
  referrer: string
  referrerPolicy: ReferrerPolicy
  integrity: string
  keepalive: boolean
}

/**
 * Serializes a Request object (or RequestInfo + RequestInit) into a plain object.
 * Handles various body types (FormData, URLSearchParams, JSON, text, blob).
 * @param {RequestInfo} input - The request or URL to serialize.
 * @param {RequestInit} [init] - Optional request options.
 * @return {Promise<SerializedRequest>} The serialized request object.
 * @throws {Error} Throws if the request body is already consumed.
 */
export async function serializeRequest(input: RequestInfo, init?: RequestInit): Promise<SerializedRequest> {
  const req = new Request(input, init)
  if (req.bodyUsed) {
    throw new Error('cannot serialize a Request whose body is already consumed')
  }

  const clone = req.clone()
  const headers = Array.from(clone.headers.entries())
  const contentType = clone.headers.get('Content-Type')?.toLowerCase() || ''

  let bodyData: SerializedRequest['body'] = undefined

  if (clone.method !== 'GET' && clone.method !== 'HEAD') {
    // Try URLSearchParams
    if (!bodyData && contentType.includes('application/x-www-form-urlencoded')) {
      const text = await clone.text()
      bodyData = {
        type: 'urlSearchParams',
        content: text,
        mimeType: 'application/x-www-form-urlencoded',
      }
    }

    // Try JSON
    if (!bodyData && contentType.includes('application/json')) {
      const text = await clone.text()
      bodyData = {
        type: 'json',
        content: text,
        mimeType: 'application/json',
      }
    }

    // Try FormData
    if (!bodyData) {
      try {
        const form = await clone.clone().formData()
        const obj: Record<string, string> = {}
        let onlyStrings = true

        for (const [key, val] of form.entries()) {
          if (typeof val === 'string') {
            obj[key] = val
          } else {
            onlyStrings = false
            break
          }
        }

        if (onlyStrings) {
          bodyData = {
            type: 'formData',
            content: JSON.stringify(obj),
            mimeType: 'application/json',
          }
        } else {
          throw new Error('FormData contains File/Blob which is not supported in this version.')
        }
      } catch {
        // formData() failed — continue
      }
    }

    // Try plain text or blob fallback
    if (!bodyData) {
      const blob = await clone.blob()
      if (blob.type.startsWith('text/') || blob.type === '') {
        const text = await blob.text()
        bodyData = {
          type: 'text',
          content: text,
          mimeType: blob.type || 'text/plain',
        }
      } else {
        const buffer = await blob.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        bodyData = {
          type: 'blob',
          content: base64,
          mimeType: blob.type,
        }
      }
    }
  }

  return {
    url: clone.url,
    method: clone.method,
    headers,
    body: bodyData,
    credentials: clone.credentials,
    cache: clone.cache,
    mode: clone.mode,
    redirect: clone.redirect,
    referrer: clone.referrer,
    referrerPolicy: clone.referrerPolicy,
    integrity: clone.integrity,
    keepalive: clone.keepalive,
  }
}

/**
 * Deserializes a SerializedRequest object back into a Request object.
 * Reconstructs the body according to its serialized type.
 * @param {SerializedRequest} data - The serialized request object.
 * @return {Request} The reconstructed Request object.
 * @throws {Error} Throws if the body type is unsupported.
 */
export function deserializeRequest(data: SerializedRequest): Request {
  let body: BodyInit | null = null

  if (data.body) {
    switch (data.body.type) {
      case 'json':
      case 'text':
        body = data.body.content
        break

      case 'urlSearchParams':
        body = new URLSearchParams(data.body.content)
        break

      case 'formData': {
        const jsonObj = JSON.parse(data.body.content)
        const formData = new FormData()
        for (const key in jsonObj) {
          formData.append(key, jsonObj[key])
        }
        body = formData
        break
      }

      case 'blob': {
        const binary = atob(data.body.content)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        body = new Blob([bytes], { type: data.body.mimeType || '' })
        break
      }
      default:
        throw new Error(`Unsupported body type: ${data.body.type}`)
    }
  }

  return new Request(data.url, {
    method: data.method,
    headers: data.headers,
    body,
    credentials: data.credentials,
    cache: data.cache,
    mode: data.mode,
    redirect: data.redirect,
    referrer: data.referrer,
    referrerPolicy: data.referrerPolicy,
    integrity: data.integrity,
    keepalive: data.keepalive,
  })
}

/**
 * SerializedResponse
 *
 * Represents a plain-object serialization of a Response, including status, headers, body, and all relevant response options.
 */
export type SerializedResponse = {
  headers: [string, string][]
  status: number
  statusText: string
  body?: {
    type: 'text' | 'json' | 'blob'
    content: string
    mimeType?: string
  }
  url: string
  redirected: boolean
  type: ResponseType
  ok: boolean
}

/**
 * Serializes a Response object into a plain object.
 * Handles text, JSON, and blob body types, and includes all relevant response properties.
 * @param {Response} response - The response to serialize.
 * @return {Promise<SerializedResponse>} The serialized response object.
 * @throws {Error} Throws if the response body is already consumed.
 */
export async function serializeResponse(response: Response): Promise<SerializedResponse> {
  if (response.bodyUsed) {
    throw new Error('Response body already consumed')
  }
  const clone = response.clone()
  const headers = Array.from(clone.headers.entries())
  const contentType = clone.headers.get('Content-Type') || ''
  const contentDisposition = clone.headers.get('Content-Disposition') || ''
  const isAttachment = contentDisposition.toLowerCase().includes('attachment')

  let bodyData: SerializedResponse['body'] = undefined

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  if (isAttachment) {
    // Always treat attachments as blob
    const blob = await clone.blob()
    const base64 = await blobToBase64(blob)
    bodyData = {
      type: 'blob',
      content: base64,
      mimeType: blob.type,
    }
  } else if (contentType.includes('application/json')) {
    const text = await clone.text()
    bodyData = {
      type: 'json',
      content: text,
      mimeType: contentType,
    }
  } else if (contentType.startsWith('text/') || contentType === '') {
    const text = await clone.text()
    bodyData = {
      type: 'text',
      content: text,
      mimeType: contentType || 'text/plain',
    }
  } else {
    const blob = await clone.blob()
    const buffer = await blob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    bodyData = {
      type: 'blob',
      content: base64,
      mimeType: blob.type,
    }
  }
  return {
    status: clone.status,
    statusText: clone.statusText,
    headers,
    body: bodyData,
    url: clone.url,
    redirected: clone.redirected,
    type: clone.type,
    ok: clone.ok,
  }
}

/**
 * Deserializes a SerializedResponse object back into a Response like object.
 * Reconstructs the body according to its serialized type and restores all relevant response properties.
 * @param {SerializedResponse} data - The serialized response object.
 * @return {Response} The reconstructed Response like object.
 */
export function deserializeResponse(data: SerializedResponse): DeserializedResponse {
  return new DeserializedResponse(data)
}

/**
 * DeserializedResponse
 *
 * A Response-like class that mimics the browser's Response object,
 * but allows setting all properties (including url, ok, redirected, etc.).
 * Used to reconstruct a Response from a SerializedResponse object.
 *
 * - Provides async methods: text(), json(), blob() for body access.
 * - All standard Response properties are available as public fields.
 * - Not a real Response instance, but can be used in most custom code as a drop-in replacement.
 */
export class DeserializedResponse {
  body: BodyInit | null
  headers: Headers
  status: number
  statusText: string
  url: string
  redirected: boolean
  type: ResponseType
  ok: boolean

  constructor(data: SerializedResponse) {
    this.body = this.deserializeBody(data.body)
    this.headers = new Headers(data.headers)
    this.status = data.status
    this.statusText = data.statusText
    this.url = data.url
    this.redirected = data.redirected
    this.type = data.type
    this.ok = data.ok
  }

  private deserializeBody(bodyData?: SerializedResponse['body']): BodyInit | null {
    if (!bodyData) return null
    switch (bodyData.type) {
      case 'text':
      case 'json':
        return bodyData.content
      case 'blob': {
        const binary = atob(bodyData.content)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        return new Blob([bytes], { type: bodyData.mimeType || '' })
      }
      default:
        return null
    }
  }

  async text(): Promise<string> {
    if (typeof this.body === 'string') return this.body
    if (this.body instanceof Blob) return await this.body.text()
    return ''
  }

  async json(): Promise<JSON> {
    const txt = await this.text()
    return JSON.parse(txt)
  }

  async blob(): Promise<Blob> {
    if (this.body instanceof Blob) return this.body
    return new Blob([await this.text()], { type: this.headers.get('content-type') || '' })
  }
}

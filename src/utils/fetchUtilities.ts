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
  const match = contentDisposition?.match(/filename\s*=\s*"?([^"]*)"?/i)
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

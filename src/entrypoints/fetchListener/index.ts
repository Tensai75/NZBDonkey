import { defineUnlistedScript } from '#imports'
import { serializeRequest } from '@/utils/fetchUtilities'

export default defineUnlistedScript(() => {
  const script = document.currentScript
  if (!script) {
    console.error('NZBDonkey: Could not get current script element')
    return
  }
  if (!script.dataset['fetchURLRegexp']) {
    console.error('NZBDonkey: fetchURLRegexp not found in script dataset')
    return
  }
  const fetchURLRegexp = new RegExp(script.dataset['fetchURLRegexp'])
  const origFetch = window.fetch
  const processRequest = async (request: RequestInfo | URL, init: RequestInit | undefined): Promise<void> => {
    try {
      const newRequest = new Request(request, init)
      const serializedRequest = await serializeRequest(newRequest)
      script.dispatchEvent(
        new CustomEvent('fromFetchListenerScript', {
          detail: serializedRequest,
        })
      )
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      console.error('NZBDonkey: Error processing intercepted fetch request', error)
    }
  }

  window.fetch = async (request, init?): Promise<Response> => {
    const url = typeof request === 'string' ? request : (request as Request).url
    if (!fetchURLRegexp.test(url)) {
      // no match, pass through the request unmodified
      return origFetch(request, init)
    }
    processRequest(request, init)
    // Return a pending response for intercepted requests
    return new Promise<Response>(() => {
      // This promise intentionally never resolves
    })
  }
})

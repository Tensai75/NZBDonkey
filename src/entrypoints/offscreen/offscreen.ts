import log from '@/services/logger/debugLogger'

log.initDebugLog('offscreen')
let timeout = setTimeout(close, 60000)
navigator.serviceWorker.onmessage = (e) => {
  log.info(`offscreen document received a message from ${e.origin}`)
  clearTimeout(timeout)
  e.ports[0].postMessage(URL.createObjectURL(e.data))
  timeout = setTimeout(window.close, 60000)
}

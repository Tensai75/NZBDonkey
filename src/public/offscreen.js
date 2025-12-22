let timeout
navigator.serviceWorker.onmessage = (e) => {
  clearTimeout(timeout)
  e.ports[0].postMessage(URL.createObjectURL(e.data))
  timeout = setTimeout(close, 60e3)
}

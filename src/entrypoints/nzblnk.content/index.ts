import { defineContentScript } from '#imports'
import log from '@/services/logger/debugLogger'
import { sendMessage } from '@/services/messengers/extensionMessenger'
import { debounceVoid } from '@/utils/generalUtilities'

export default defineContentScript({
  registration: 'manifest',
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  allFrames: true,
  main() {
    sendMessage('getGeneralSettings', true).then(async (settings) => {
      if (!(await settings).catchLinks) return
      log.initDebugLog('nzblnk-content')

      const handleNzblnkClick = debounceVoid(
        (href: string) => {
          log.info(`click on nzblnk link detected: ${href}`)
          void sendMessage('searchNzbFile', {
            nzblnk: href,
            source: document.URL,
          })
        },
        500,
        true
      ) // 500ms debounce window

      document.addEventListener('click', (event: MouseEvent) => {
        try {
          const anchor = (event.target as HTMLElement)?.closest('a[href^="nzblnk"]') as HTMLAnchorElement | null
          if (anchor) {
            const href = anchor.getAttribute('href')
            if (href) {
              event.preventDefault()
              handleNzblnkClick(href)
            }
          }
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e))
          log.error('error while processing click event', error)
        }
      })
      log.info('nzblnk content script loaded successfully')
    })
  },
})

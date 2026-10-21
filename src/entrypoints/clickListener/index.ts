import { defineUnlistedScript } from '#imports'
import { getRelativeURL, serializeRequest } from '@/utils/fetchUtilities'

export default defineUnlistedScript(() => {
  const script = document.currentScript
  if (!script) {
    console.error('NZBDonkey: Could not get current script element')
    return
  }
  if (!script.dataset['URLRegexp']) {
    console.error('NZBDonkey: URLRegexp not found in script dataset')
    return
  }
  const URLRegexp = new RegExp(script.dataset['URLRegexp'])
  const classes = script.dataset['classes'] ? script.dataset['classes'].split(',') : undefined
  const attributes = script.dataset['attributes'] ? script.dataset['attributes'].split(',') : undefined
  const contentRegexp = script.dataset['contentRegExp'] ? new RegExp(script.dataset['contentRegExp']) : undefined

  const processClick = async (url: string): Promise<void> => {
    try {
      const newRequest = new Request(url)
      const serializedRequest = await serializeRequest(newRequest)
      script.dispatchEvent(
        new CustomEvent('fromClickListenerScript', {
          detail: serializedRequest,
        })
      )
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      console.error('NZBDonkey: Error processing intercepted click request', error)
    }
  }

  const handleClick = (event: MouseEvent): void => {
    // 0 = left, 1 = middle; right click (2) is ignored.
    if (event.button !== 0 && event.button !== 1) return
    const targetAnchor = (event.target as Element | null)?.closest('a')
    if (!targetAnchor) return
    const url = targetAnchor.href
    if (!url) return
    let relativeURL: string
    try {
      relativeURL = getRelativeURL(url)
    } catch {
      return
    }
    if (!URLRegexp.test(relativeURL)) return
    if (classes && !classes.every((cls) => targetAnchor.classList.contains(cls))) return
    if (attributes && !attributes.every((attr) => targetAnchor.hasAttribute(attr))) return
    if (contentRegexp && !contentRegexp.test(targetAnchor.textContent ?? '')) return
    event.preventDefault()
    event.stopImmediatePropagation()
    void processClick(url)
  }

  // Add click listeners
  window.addEventListener('click', handleClick, { capture: true })
  window.addEventListener('auxclick', handleClick, { capture: true })
})

import { browser } from '#imports'
import log from '@/services/logger/debugLogger'

export async function openPopupWindow(source: string): Promise<number> {
  try {
    log.info(`openinge popup dialog window with source "${source}"`)
    const win = await browser.windows.getCurrent()
    const width = 250
    const height = 250
    const left = win.width ? Math.round(win.width / 2 - width / 2 + (win.left ?? 0)) : 0
    const top = win.height ? Math.round(win.height / 2 - height / 2 + (win.top ?? 0)) : 0
    const window = await browser.windows.create({
      url: source,
      left: left,
      top: top,
      width: width,
      height: height,
      type: 'popup',
    })
    if (window.id) {
      log.info(`popup dialog window with source "${source}" opened with id ${window.id}`)
      return window.id
    } else {
      throw new Error('window id is not defined')
    }
  } catch (e) {
    const err = new Error(
      `error while opening popup dialog window with source "${source}": ${
        e instanceof Error ? e.message : 'unknown error'
      }`
    )
    log.error(err.message)
    throw err
  }
}

export async function resizePopupWindow(width: number, height: number): Promise<void> {
  const barHeight = window.outerHeight - window.innerHeight
  const totalHeight = height + barHeight
  const left = screen.availWidth / 2 - width / 2 + (screen as Screen & { availLeft: number }).availLeft
  const top = screen.availHeight / 2 - totalHeight / 2 + (screen as Screen & { availTop: number }).availTop

  const popupWindow = await browser.windows.getCurrent()
  await browser.windows.update(popupWindow.id as number, {
    width: Math.round(width),
    height: Math.round(totalHeight),
    top: Math.round(top),
    left: Math.round(left),
  })
}

export function focusPopupWindow(intervall: number) {
  browser.windows.getCurrent().then((window) => {
    setInterval(async () => {
      const focusedWindow = await browser.windows.getLastFocused()
      if (focusedWindow.id != window.id) {
        browser.windows.update(window.id as number, {
          focused: true,
          drawAttention: true,
        })
      }
    }, intervall)
  })
}

/**
 * Set the zoom level of the currently active tab.
 * @param zoom Factor > 0 (e.g. 1 = 100%, 1.25 = 125%, 0.8 = 80%)
 * @returns previous zoom level
 */
export async function setZoomTo100(): Promise<void> {
  // Get active tab in current window
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  // Apply new zoom
  await browser.tabs.setZoom(tab.id, 1)
}

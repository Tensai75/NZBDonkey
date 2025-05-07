import { browser } from '#imports'
import log from '@/services/logger/debugLogger'

export async function openPopupWindow(source: string): Promise<number> {
  try {
    log.info(`openinge popup dialog window with source "${source}"`)
    const win = await browser.windows.getCurrent()
    const width = win.width && win.width < 250 ? win.width : 250
    const height = win.height && win.height < 250 ? win.height : 250
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

export function resizePopupWindow(selector: string, maxWidth: number, maxHeight: number) {
  let contentHeight = 0
  document.querySelectorAll(selector).forEach((element) => {
    contentHeight += (element as HTMLElement).clientHeight
  })
  let targetHeight = contentHeight + 250
  if (targetHeight > maxHeight) targetHeight = maxHeight
  browser.windows.getCurrent().then((window) => {
    if (window.height !== targetHeight) {
      // resize and move window to center
      const width = screen.availWidth < maxWidth ? screen.availWidth : maxWidth
      const height = screen.availHeight < targetHeight ? screen.availHeight : targetHeight
      // screen.availLeft and screen.availTop are available on Firefox and Chrome
      const left = Math.round(screen.availWidth / 2 - width / 2 + (screen as Screen & { availLeft: number }).availLeft)
      const top = Math.round(screen.availHeight / 2 - height / 2 + (screen as Screen & { availTop: number }).availTop)
      browser.windows.update(window.id as number, { width: width, height: height, left, top }).then(() => {
        resizePopupWindow(selector, maxWidth, maxHeight)
      })
    }
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

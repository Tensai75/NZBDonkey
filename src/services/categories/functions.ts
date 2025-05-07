import { CategoriesSettings } from './settings'

import { browser, Browser } from '#imports'
import log from '@/services/logger/debugLogger'
import { openPopupWindow } from '@/utils/popupWindowUtilities'

export const getCategory = async (settings: CategoriesSettings, title: string): Promise<string> => {
  log.info(`determing category for "${title}"`)
  let category = ''
  if (settings.useCategories) {
    if (settings.type === 'automatic') {
      category = getAutomaticCategory(settings, title)
      if (category === '') {
        if (settings.fallback === 'fixed') {
          category = getDefaultCategory(settings)
        } else if (settings.fallback === 'manual') {
          category = await getManualCategory(settings, title)
        }
      }
    } else if (settings.type === 'fixed') {
      category = getDefaultCategory(settings)
    } else if (settings.type === 'manual') {
      category = await getManualCategory(settings, title)
    }
  }
  log.info(`category is set to: ${category}`)
  return category
}

export const getAutomaticCategory = (settings: CategoriesSettings, title: string): string => {
  let category = ''
  if (settings.categories.length > 0) {
    for (const cat of settings.categories) {
      if (cat.active === false) continue
      if (cat.regexp === '') continue
      const reg = new RegExp(cat.regexp, 'i')
      if (reg.test(title)) {
        category = cat.name
        break
      }
    }
  }
  return category
}

export const getDefaultCategory = (settings: CategoriesSettings): string => {
  return settings.categories.find((cat) => cat.isDefault)?.name || ''
}

export const getManualCategory = async (settings: CategoriesSettings, title: string): Promise<string> => {
  if (settings.categories.length === 0) {
    log.warn('manual category selection requires at least one category')
    Promise.resolve('')
  }
  const windowId = await openPopupWindow('/categoryselection.html')

  return new Promise((resolve, reject) => {
    const onConnectListener = (port: Browser.runtime.Port) => {
      if (port.name === 'categorySelection_' + windowId) {
        port.onMessage.addListener((message) => {
          if (typeof message === 'string') {
            log.info(`received category "${message}" from category selection dialog window`)
            browser.windows.remove(windowId)
            removeListeners()
            resolve(message)
          } else {
            log.warn('category selection dialog window was cancelled')
            cancel()
          }
        })
        port.postMessage({ categories: settings.categories, title: title })
      }
    }
    const onRemovedWindowListener = (winId: number) => {
      if (windowId === winId) {
        log.warn(`category selection dialog window with id ${windowId} was closed before sending a message`)
        cancel()
      }
    }
    const removeListeners = () => {
      browser.runtime.onConnect.removeListener(onConnectListener)
      browser.windows.onRemoved.removeListener(onRemovedWindowListener)
    }
    const cancel = () => {
      browser.windows.remove(windowId)
      removeListeners()
      reject(new Error('processing aborted by user'))
    }
    browser.runtime.onConnect.addListener(onConnectListener)
    browser.windows.onRemoved.addListener(onRemovedWindowListener)
  })
}

import { i18n } from '#i18n'
import { browser } from '#imports'
import { get as getGeneralSettings } from '@/services/general/settings'

export function notification(level: number, message: string, id: string = '') {
  getGeneralSettings().then((settings) => {
    if (level >= settings.notifications) {
      const title = i18n.t('extension.name')
      const notificationID = id != '' ? 'NZBDonkey_#' + id : 'NZBDonkey_#' + Date.now().toString()
      const iconURL = ['icon/128.png', 'icon/success_128.png', 'icon/error_128.png']
      browser.notifications.create(notificationID, {
        type: 'basic',
        iconUrl: iconURL[level],
        title: title,
        message: message,
      })
    }
  })
}

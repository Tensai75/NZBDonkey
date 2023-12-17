import settings from '../settings/settings.js';
import debugLog from '../logger/debugLog.js';

function notification(level, message, id = false) {
  if (level >= settings.get().general.notifications) {
    let title = chrome.i18n.getMessage('general_extensionName');
    let notificationID =
      id !== false ? 'NZBDonkey_#' + id.toString() : 'NZBDonkey';
    const iconURL = [
      'icons/NZBDonkey_128.png',
      'icons/NZBDonkey_success_128.png',
      'icons/NZBDonkey_error_128.png',
    ];
    debugLog.info(
      chrome.i18n.getMessage('debug_sendingNotification'),
      message
    )();
    browser.notifications.create(notificationID, {
      type: 'basic',
      iconUrl: iconURL[level],
      title: title,
      message: message,
    });
  }
}

export default {
  error: (message, id = false) => notification(2, message, id),
  success: (message, id = false) => notification(1, message, id),
  info: (message, id = false) => notification(0, message, id),
};

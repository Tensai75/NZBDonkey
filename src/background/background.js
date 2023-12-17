import { version } from '../../package.json';
import debugLog from '../logger/debugLog.js';
import settings from '../settings/settings.js';
import contextmenu from './contextmenu.js';
import interception from '../interception/functions.js';
import notification from './notification.js';
import NZB from './nzb.js';

// set global development and debug mode
if (process.env.NODE_ENV === 'development') {
  window.NZBDONKEY_DEVELOPMENT = true;
  window.NZBDONKEY_DEBUG = true;
  debugLog.info(chrome.i18n.getMessage('debug_developmentModeOn'))();
}

window.NZBDONKEY_SCRIPT = 'background';
debugLog.info(
  chrome.i18n.getMessage('debug_ScriptVersion', ['Background', version])
)();

function messageListenerInit() {
  debugLog.info(
    chrome.i18n.getMessage('debug_initialisingContenScriptListener')
  )();
  browser.runtime.onMessage.addListener(async (request) => {
    try {
      if (request.action === 'doTheDonkey') {
        debugLog.info(
          chrome.i18n.getMessage(
            'debug_searchInformationReceivedFromContentScript'
          ),
          request
        )();
        let nzb = new NZB({
          header: request.header,
          title: request.title ? request.title : request.header,
          password: request.password ? request.password : false,
          target: request.target ? request.target : false,
          category: request.category ? request.category : false,
          source: request.source ? request.source : false,
        });
        nzb.getNZB();
      } else if (request.action === 'debugLog') {
        debugLog[request.type](request.text, request.source, true)();
      }
      return true;
    } catch (e) {
      debugLog.error(
        chrome.i18n.getMessage('error_contentScriptListenerError')
      )();
      if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
      notification.error(`ERROR: ${e.message}`);
    }
  });
  debugLog.info(
    chrome.i18n.getMessage(
      'debug_contentScriptMessageListenersSuccessfullyInitialised'
    )
  )();
}

(async () => {
  try {
    debugLog.info(
      chrome.i18n.getMessage('debug_initialisingBackgroundScript')
    )();
    debugLog.clear();
    await settings.init();
    contextmenu.init(settings.get());
    messageListenerInit();
    interception.init();
    debugLog.info(
      chrome.i18n.getMessage('debug_backgroundScriptSuccessfullyInitialised')
    )();
    notification.success(
      chrome.i18n.getMessage('info_donkeySuccessfullyInitialised', version)
    );
  } catch (e) {
    debugLog.error(
      chrome.i18n.getMessage('error_initialisingBackgroundScript', e.message)
    )();
    if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
    notification.error(
      chrome.i18n.getMessage('error_initialisingDonkeyVersion', [
        version,
        e.message,
      ])
    );
  }
})();

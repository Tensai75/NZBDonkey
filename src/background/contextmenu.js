import debugLog from '../logger/debugLog.js';
import notification from './notification.js';
import NZB from './nzb.js';
import { isset, analyseURL } from '../functions/functions.js';

function init(settings) {
  debugLog.info(chrome.i18n.getMessage('debug_initialisingContextMenu'))();
  try {
    setContextMenu(settings);
    browser.storage.onChanged.addListener((changes) => {
      if (changes.target) {
        setContextMenu({ target: changes.target.newValue });
      }
    });
    debugLog.info(
      chrome.i18n.getMessage('debug_contextMenuSuccessfullyInitialised')
    )();
  } catch (e) {
    debugLog.error(
      chrome.i18n.getMessage('error_whileInitialisingContextMenu')
    )();
    throw e;
  }
}

function setContextMenu(settings) {
  debugLog.info(chrome.i18n.getMessage('debug_settingContextMenu'))();
  try {
    browser.contextMenus.remove('NZBDonkey_Link').then(
      () => true,
      () => true
    );
    browser.contextMenus.remove('NZBDonkey_Selection').then(
      () => true,
      () => true
    );
    let targets = [];
    settings.target.targets.forEach(function (target, index) {
      if (target.active) {
        targets.push({ index: index, name: target.name });
      }
    });
    browser.contextMenus.create({
      title:
        chrome.i18n.getMessage('contextmenu_nzbdonkeySendTo') +
        (targets.length > 1 &&
        (settings.target.showTargetsInContextMenu ||
          settings.target.allowMultipleTargets)
          ? ':'
          : ' ' + settings.target.targets[settings.target.defaultTarget].name),
      contexts: ['link'],
      id: 'NZBDonkey_Link',
    });

    browser.contextMenus.create({
      title: chrome.i18n.getMessage('contextmenu_nzbdonkeyAnalyseSelection'),
      contexts: ['selection'],
      id: 'NZBDonkey_Selection',
    });

    if (
      targets.length > 1 &&
      (settings.target.showTargetsInContextMenu ||
        settings.target.allowMultipleTargets)
    ) {
      targets.forEach(function (target, index) {
        browser.contextMenus.create({
          title: target.name,
          contexts: ['link'],
          parentId: 'NZBDonkey_Link',
          id: index.toString(),
        });
      });
    }
    if (browser.contextMenus.onClicked.hasListener(listener))
      browser.contextMenus.onClicked.removeListener(listener);
    browser.contextMenus.onClicked.addListener(listener);
    debugLog.info(chrome.i18n.getMessage('debug_contextMenuSuccessfullySet'))();
  } catch (e) {
    debugLog.error(
      chrome.i18n.getMessage('error_whileSettingContextMenu', e.message)
    )();
    throw e;
  }
}

async function listener(info, tab) {
  try {
    if (
      info.menuItemId === 'NZBDonkey_Link' ||
      info.parentMenuItemId === 'NZBDonkey_Link'
    ) {
      debugLog.info(
        chrome.i18n.getMessage('debug_contextMenuClickOnLinkDetected')
      )();
      let url = analyseURL(info.linkUrl);
      if (
        isset(() => url.scheme) &&
        url.scheme === 'nzblnk' &&
        isset(() => url.parameters.h)
      ) {
        debugLog.info(chrome.i18n.getMessage('debug_validNzblnkDetected'))();
        let nzb = new NZB({
          header: url.parameters.h,
          title: url.parameters.t ? url.parameters.t : url.parameters.h,
          password: url.parameters.p ? url.parameters.p : false,
          target:
            info.parentMenuItemId === 'NZBDonkey_Link'
              ? Number(info.menuItemId)
              : false,
          source: tab.url,
        });
        nzb.getNZB();
      } else {
        throw new Error(chrome.i18n.getMessage('debug_noValidNzblnkDetected'));
      }
    } else if (info.menuItemId === 'NZBDonkey_Selection') {
      debugLog.info(
        chrome.i18n.getMessage('debug_clickOnTextSelectionDetected')
      )();
      browser.tabs.sendMessage(tab.id, {
        action: 'analyseSelection',
      });
    }
  } catch (e) {
    debugLog.error(
      chrome.i18n.getMessage('error_whileProcessingUserInteraction', e.message)
    )();
    notification.error(
      chrome.i18n.getMessage('error_whileProcessingUserInteraction', e.message)
    );
  }
}

export default { init };

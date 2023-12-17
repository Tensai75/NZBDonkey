import debugLog from '../logger/debugLog.js';
import settings from '../settings/settings.js';
import { isset } from '../functions/functions.js';

export default {
  getCategory: async function (target, title, manual = true) {
    let targetSettings = settings.get().target.targets[target].settings;
    if (targetSettings.useCategories === true) {
      let category = false;
      category = await this[targetSettings.categories.type](
        target,
        title,
        manual
      );
      if (
        category === false &&
        targetSettings.categories.type === 'automatic' &&
        targetSettings.categories.fallbackType !== 'none'
      ) {
        debugLog.info(
          `Trying fallback option "${targetSettings.categories.fallbackType}" to set the category`
        )();
        category = await this[targetSettings.categories.fallbackType](
          target,
          title,
          manual
        );
      }
      return category;
    } else {
      debugLog.info(
        `Categories are disabled for target "${
          settings.get().target.targets[target].settings.name
        }"`
      )();
      return false;
    }
  },
  automatic: function (target, title) {
    let targetSettings = settings.get().target.targets[target].settings;
    debugLog.info('Automatic testing for categories')();
    if (targetSettings.categories.categories.length === 0) {
      debugLog.warn('No categories defined for this target')();
      return false;
    }
    for (let category of targetSettings.categories.categories) {
      if (typeof category.regex === 'string' && category.regex.length > 0) {
        const re = new RegExp(category.regex, 'i');
        debugLog.info(
          `Testing for category "${category.name}" with RegEx "${re}"`
        )();
        if (re.test(title)) {
          debugLog.info(`Match found for category "${category.name}"`)();
          return category.name;
        }
      }
    }
    debugLog.info('No match found with automatic category testing')();
    return false;
  },
  default: function (target) {
    let targetSettings = settings.get().target.targets[target].settings;
    debugLog.info('Setting default category')();
    let defaultCategory = targetSettings.categories.defaultCategory;
    if (
      isset(() => targetSettings.categories.categories[defaultCategory].name) &&
      typeof targetSettings.categories.categories[defaultCategory].name ===
        'string' &&
      targetSettings.categories.categories[defaultCategory].name.length > 0
    ) {
      return targetSettings.categories.categories[defaultCategory].name;
    } else {
      debugLog.warn('No default category was set in the settings')();
      return false;
    }
  },
  manual: async function (target, title, manual) {
    if (!manual) return false;
    const categories = this.getCategories(target);
    if (!categories) return false;
    debugLog.info('Starting manual category selection')();
    const win = await browser.windows.getCurrent();
    const width = win.width < 540 ? win.width : 540;
    const height = screen.height < 680 ? screen.height : 680;
    const left = win.width / 2 - width / 2 + win.left;
    const top = screen.height / 2 - height / 2;
    const window = await browser.windows.create({
      url: '/categorySelection.html',
      width: width,
      height: height,
      top: Math.round(top),
      left: Math.round(left),
      type: 'popup',
    });
    const windowId = window.id;
    debugLog.info(
      `Opened popup window with id ${windowId} for category selection`
    )();
    const waitForPopup = new Promise((resolve, reject) => {
      // onRemoveWindowListener function
      const onRemoveWindowListener = (winId) => {
        if (windowId == winId) {
          debugLog.warn(
            `Popup window with id ${windowId} for category selection was closed before sending a message`
          )();
          reject(new Error('Category selection was cancelled by the user'));
        }
      };
      // onConnectListener function
      const onConnectListener = (port) => {
        if (port.name == `categorySelection_${windowId}`) {
          port.onMessage.addListener(async (response) => {
            if (response.windowId === windowId) {
              if (response.ready) {
                debugLog.info(
                  `Received ready message from popup window with id ${port.sender.tab.windowId}`
                )();
                debugLog.info(
                  `Sending category information to popup window with id ${port.sender.tab.windowId} for category selection`
                )();
                port.postMessage({
                  categories: categories,
                  title: title,
                  windowId: windowId,
                });
              } else if (typeof response.category === 'string') {
                debugLog.info(
                  `Received selected category message from popup window with id ${port.sender.tab.windowId}`
                )();
                port.onMessage.removeListener(this);
                browser.windows.onRemoved.removeListener(
                  onRemoveWindowListener
                );
                browser.runtime.onConnect.removeListener(onConnectListener);
                browser.windows.remove(windowId);
                resolve(response.category);
              } else if (response.category === false) {
                port.onMessage.removeListener(this);
                browser.windows.onRemoved.removeListener(
                  onRemoveWindowListener
                );
                browser.runtime.onConnect.removeListener(onConnectListener);
                browser.windows.remove(windowId);
                debugLog.info(
                  `Received cancelled message from popup window with id ${port.sender.tab.windowId}`
                )();
                resolve(false);
              } else {
                debugLog.warn(
                  `Received unknown response from popup window with id ${port.sender.tab.windowId}`
                )();
              }
            }
          });
        }
      };
      browser.windows.onRemoved.addListener(onRemoveWindowListener);
      browser.runtime.onConnect.addListener(onConnectListener);
    });
    return await waitForPopup;
  },
  getCategories: function (target) {
    const targetSettings = settings.get().target.targets[target].settings;
    if (
      isset(() => targetSettings.categories.categories) &&
      targetSettings.categories.categories.length > 0
    ) {
      return targetSettings.categories.categories;
    } else {
      debugLog.warn('No categories defined for this target')();
      return false;
    }
  },
};

import debugLog from '../logger/debugLog.js';

export default {
  select: async (nzb) => {
    const targets = nzb.settings.target.targets.filter(
      (target) => target.active
    );
    if (targets.length === 0) {
      throw new Error(
        'There are no active nzb file targets. Please check settings.'
      );
    }
    const win = await browser.windows.getCurrent();
    const width = win.width < 540 ? win.width : 540;
    const height = screen.height < 680 ? screen.height : 680;
    const left = win.width / 2 - width / 2 + win.left;
    const top = screen.height / 2 - height / 2;
    const window = await browser.windows.create({
      url: '/targetSelection.html',
      width: width,
      height: height,
      top: Math.round(top),
      left: Math.round(left),
      type: 'popup',
    });
    const windowId = window.id;
    debugLog.info(
      `Opened popup window with id ${windowId} for target selection`
    )();
    const waitForPopup = new Promise((resolve, reject) => {
      // onRemoveWindowListener function
      const onRemoveWindowListener = (winId) => {
        if (windowId == winId) {
          debugLog.warn(
            `Popup window with id ${windowId} for target selection was closed before sending a message`
          )();
          reject(new Error('Target selection was cancelled by the user'));
        }
      };
      // onConnectListener function
      const onConnectListener = (port) => {
        if (port.name == `targetSelection_${windowId}`) {
          port.onMessage.addListener(async (response) => {
            if (response.windowId === windowId) {
              if (response.ready) {
                debugLog.info(
                  `Received ready message from popup window with id ${port.sender.tab.windowId}`
                )();
                debugLog.info(
                  `Sending target information to popup window with id ${port.sender.tab.windowId} for target selection`
                )();
                port.postMessage({
                  targets: targets,
                  title: nzb.title,
                  id: nzb.id,
                  windowId: windowId,
                });
              } else if (typeof response.target === 'number') {
                debugLog.info(
                  `Received selected target message from popup window with id ${port.sender.tab.windowId}`
                )();
                port.onMessage.removeListener(this);
                browser.windows.onRemoved.removeListener(
                  onRemoveWindowListener
                );
                browser.runtime.onConnect.removeListener(onConnectListener);
                browser.windows.remove(windowId);
                resolve(response.target);
              } else if (response.target === false) {
                port.onMessage.removeListener(this);
                browser.windows.onRemoved.removeListener(
                  onRemoveWindowListener
                );
                browser.runtime.onConnect.removeListener(onConnectListener);
                browser.windows.remove(windowId);
                debugLog.warn(
                  `Received cancelled message from popup window with id ${port.sender.tab.windowId}`
                )();
                reject(new Error('Target selection was cancelled by the user'));
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
    const target = await waitForPopup;
    return target;
  },
};

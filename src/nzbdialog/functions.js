import debugLog from '../logger/debugLog.js';

export default {
  show: async function (nzb) {
    const win = await browser.windows.getCurrent();
    const width = win.width < 540 ? win.width : 540;
    const height = screen.height < 680 ? screen.height : 680;
    const left = win.width / 2 - width / 2 + win.left;
    const top = screen.height / 2 - height / 2;
    const window = await browser.windows.create({
      url: '/nzbDialog.html',
      width: width,
      height: height,
      top: Math.round(top),
      left: Math.round(left),
      type: 'popup',
    });
    const windowId = window.id;
    debugLog.info(`Opened NZB dialog window with id ${windowId}`)();
    const waitForPopup = new Promise((resolve, reject) => {
      // onRemoveWindowListener function
      const onRemoveWindowListener = (winId) => {
        if (windowId == winId) {
          debugLog.warn(
            `NZB dialog window with id ${windowId} was closed before sending a message`
          )();
          reject(new Error('NZB download was cancelled by the user'));
        }
      };
      // onConnectListener function
      const onConnectListener = (port) => {
        if (port.name == `nzbDialog_${windowId}`) {
          port.onMessage.addListener(async (response) => {
            if (response.windowId === windowId) {
              if (response.ready) {
                debugLog.info(
                  `Received ready message from NZB dialog window with id ${port.sender.tab.windowId}`
                )();
                debugLog.info(
                  `Sending nzb information to NZB dialog window with id ${port.sender.tab.windowId}`
                )();
                port.postMessage({
                  nzb: {
                    title: nzb.title,
                    header: nzb.header,
                    password: nzb.password,
                    target: nzb.target,
                    category: nzb.category,
                  },
                  windowId: windowId,
                });
              } else if (response.nzb) {
                debugLog.info(
                  `Received nzb information message from NZB dialog window with id ${port.sender.tab.windowId}`
                )();
                port.onMessage.removeListener(this);
                browser.windows.onRemoved.removeListener(
                  onRemoveWindowListener
                );
                browser.runtime.onConnect.removeListener(onConnectListener);
                browser.windows.remove(windowId);
                nzb.title =
                  typeof response.nzb.title === 'string' &&
                  response.nzb.title.length > 0
                    ? response.nzb.title
                    : false;
                nzb.header =
                  typeof response.nzb.header === 'string' &&
                  response.nzb.header.length > 0
                    ? response.nzb.header
                    : false;
                nzb.password =
                  typeof response.nzb.password === 'string' &&
                  response.nzb.password.length > 0
                    ? response.nzb.password
                    : false;
                nzb.target =
                  typeof response.nzb.target === 'number'
                    ? response.nzb.target
                    : false;
                nzb.category =
                  typeof response.nzb.category === 'string' &&
                  response.nzb.category.length > 0
                    ? response.nzb.category
                    : '';
                resolve();
              } else if (response.nzb === false) {
                port.onMessage.removeListener(this);
                browser.windows.onRemoved.removeListener(
                  onRemoveWindowListener
                );
                browser.runtime.onConnect.removeListener(onConnectListener);
                browser.windows.remove(windowId);
                debugLog.warn(
                  `Received cancelled message from NZB dialog window with id ${port.sender.tab.windowId}`
                )();
                reject(new Error('NZB download was cancelled by the user'));
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
    await waitForPopup;
    return nzb;
  },
};

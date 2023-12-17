import { decode as htmlDecode } from 'html-entities';
import debugLog from '../logger/debugLog.js';
import nzbLog from '../logger/nzbLog.js';
import options from '../settings/settings.js';
import notification from '../background/notification.js';
import {
  isset,
  analyseURL,
  myFetch,
  generateFormData,
  nzb2xml,
} from '../functions/functions.js';
import download from '../targets/download/target.class.js';
import { Archive } from 'libarchive.js/main.js';
import NZB from '../background/nzb.js';
import nzbDialog from '../nzbdialog/functions.js';

const onHeadersReceivedEventListener = function (
  details,
  settings = options.get()
) {
  // first check if it is in the list or return
  if (!interception.requestIDs[details.requestId]) return;

  // get the content-disposition header or return
  const header = details.responseHeaders.find((header) => {
    return /^content-disposition$/i.test(header.name);
  });
  if (header) {
    // get the settings for the current domain
    const domainSettings = settings.interception.domains.filter((domain) => {
      return (
        domain.domain ===
        analyseURL(interception.requestIDs[details.requestId].url).basedomain
      );
    })[0];

    // check if we have a nzb file or packed file
    if (
      header &&
      (/filename\s*=\s*"?((.*)\.nzb)"?/i.test(header.value) ||
        (/filename\s*=\s*"?((.*)\.(rar|zip|7z|gz|tar(\.gz)?|tgz))"?/i.test(
          header.value
        ) &&
          domainSettings.packedFiles))
    ) {
      // intercept the request asynchronously
      setTimeout(interception.intercept(header, details, domainSettings), 0);

      // abort original request
      debugLog.info(`Cancelling original request for "${details.url}"`)();
      return chrome.webRequest.OnSendHeadersOptions.EXTRA_HEADERS
        ? {
            // for chrome, redirec the url to 'https://robwu.nl/204' (no content) to avoid the ERR_BLOCKED_BY_CLIENT error
            redirectUrl: 'https://robwu.nl/204',
          }
        : {
            // for ff just cancel the request
            cancel: true,
          };
    }
  }
  // if no interception was required, free up some space
  delete interception.requestIDs[details.requestId];
  return;
};

const onBeforeRequestEventListener = function (details) {
  interception.requestIDs[details.requestId] = {};
  // get the source of this request
  interception.requestIDs[details.requestId].source = details.originUrl
    ? details.originUrl
    : details.initiator;
  // get the url of this request
  interception.requestIDs[details.requestId].url = details.url;
  // check if there is a request body
  if (
    isset(() => details.requestBody) &&
    typeof details.requestBody === 'object'
  ) {
    // check if the request body contains form data
    if (
      isset(() => details.requestBody.formData) &&
      typeof details.requestBody.formData === 'object'
    ) {
      // get the form data of this request
      interception.requestIDs[details.requestId].formData =
        details.requestBody.formData;
    }
  }
};

const onBeforeSendHeadersEventListener = function (details) {
  // if header name is X-NZBDonkey
  if (
    details.requestHeaders.find((header) => {
      return /^x-nzbdonkey$/i.test(header.name);
    })
  ) {
    // get Referer
    const xReferer = details.requestHeaders.find((header) => {
      return /^x-referer$/i.test(header.name);
    });
    if (xReferer && xReferer.value) {
      // change/add referer header for the new request
      let referer = false;
      for (const header of details.requestHeaders) {
        if (header.name.toLowerCase() === 'referer') {
          header.value = xReferer.value;
          referer = true;
        }
      }
      if (!referer) {
        details.requestHeaders.push({
          name: 'Referer',
          value: xReferer.value,
        });
      }
    }
    // remove request ID
    delete interception.requestIDs[details.requestId];
    // return new headers
    return { requestHeaders: details.requestHeaders };
  } else {
    // add referer as source if available
    const referer = details.requestHeaders.find((header) => {
      return /^referer$/i.test(header.name);
    });
    if (referer) {
      interception.requestIDs[details.requestId].source = referer.value;
    }
  }
};

export default class interception {
  requestIDs = [];

  static init(settings = options.get()) {
    try {
      debugLog.info('Initialising the NZB file download interception')();
      this.setListeners(settings);
      browser.storage.onChanged.addListener((changes) => {
        if (changes.interception) {
          this.setListeners({
            interception: { ...changes.interception.newValue },
          });
        }
      });
      debugLog.info('NZB file download interception succesfully initialised')();
    } catch (e) {
      debugLog.error(
        `Error wihle initialising the NZB file download interception: ${e.message}`
      )();
      throw e;
    }
  }

  static intercept(header, details, domainSettings) {
    let file = {};
    file.url = this.requestIDs[details.requestId].url;
    file.source = this.requestIDs[details.requestId].source;
    file.name = header.value.match(
      /filename\s*=\s*"?((.*)\.(nzb|rar|(g)?zip|7z(ip)?|bz2|lzma|gz|tar(\.gz)?|tgz))"?/i
    )[2];
    file.extension = header.value.match(
      /filename\s*=\s*"?((.*)\.(nzb|rar|(g)?zip|7z(ip)?|bz2|lzma|gz|tar(\.gz)?|tgz))"?/i
    )[3];

    debugLog.info(
      `Intercepting download of ${file.name}.${file.extension} from ${file.source}`
    )();
    notification.info(
      `Intercepting download of ${file.name}.${file.extension} from ${file.source}`
    );

    // check for form data
    if (
      isset(() => this.requestIDs[details.requestId].formData) &&
      typeof this.requestIDs[details.requestId].formData === 'object'
    ) {
      debugLog.info('Found post form data for intercepted nzb file request')();

      // handle the Form Data according to the settings of the current domain, use sendFormDataAsPOST as default
      file = this[domainSettings.handling || 'sendFormDataAsPOST'](
        file,
        details
      );
    }

    if (file.extension === 'nzb') {
      file.title = file.name.match(/^(.*?)(?:{{(.*?)}})?(?:\.nzb)?$/)
        ? file.name.match(/^(.*?)(?:{{(.*?)}})?(?:\.nzb)?$/)[1]
        : file.name;
      file.password = file.name.match(/^(.*?)(?:{{(.*?)}})?(?:\.nzb)?$/)
        ? file.name.match(/^(.*?)(?:{{(.*?)}})?(?:\.nzb)?$/)[2]
        : false;
    }

    // calling the function to take over the nzb file download
    this.download(file, domainSettings);

    // close any opened tabs and free up some space
    browser.tabs
      .get(details.tabId)
      .then((tab) => {
        if (tab.openerTabId && tab.openerTabId != details.tabId) {
          debugLog.info(`Closing tab with ID ${details.tabId}`)();
          browser.tabs.remove(details.tabId);
        }
      })
      .catch((e) => {
        debugLog.error(
          `Error while trying to close tab with ID ${details.tabId}: ${e.message}`
        )();
      })
      .finally(() => delete interception.requestIDs[details.requestId]);
  }

  static async download(file, domainSettings) {
    const settings = options.get();
    let response = false;
    try {
      let options = {
        url: file.url,
        init: {
          credentials: 'include',
        },
        headers: { 'X-Referer': file.source },
      };
      if (file.extension !== 'nzb') options.type = 'blob';
      if (file.formData) options.data = file.formData;
      try {
        response = await myFetch(options);
      } catch (e) {
        let error = e.message ? e.message : `Unknown Error!`;
        debugLog.warn(
          `Error while trying to download the file "${file.url}": ${error}`
        )();
        throw new Error(error);
      }
      let nzbData = [];
      if (file.extension !== 'nzb') {
        nzbData = await this.unpack(response);
      } else {
        nzbData = [
          {
            data: nzb2xml(response),
            title: file.title,
            password: file.password,
          },
        ];
      }
      if (nzbData.length > 0) {
        for (const data of nzbData) {
          let nzb = new NZB({
            source: file.source,
            engine: 'interception',
            ...data,
          });
          nzb.password = this.getPassword(nzb);
          nzb.title = domainSettings.useSubject
            ? this.getSubject(nzb)
            : nzb.title;
          nzb.id = await nzbLog.log(nzb, 'intercepting');
          // nzb dialog
          if (settings.interception.showDialog) {
            try {
              nzb = await nzbDialog.show(nzb);
            } catch (e) {
              nzb.error(
                new Error(
                  `Error while processing file "${nzb.title}": ${e.message}`
                )
              );
              continue;
            }
          }
          nzb.getNZB();
        }
      } else {
        // no nzb file?
        throw new Error('No NZB file found in the intercepted download');
      }
    } catch (e) {
      debugLog.error(
        `Error while intercepting download of file "${file.url}": ${e.message}`
      )();
      notification.error(
        `Error while intercepting download of file "${file.url}": ${e.message}`
      );
      // if we had a response, let the user download it
      if (response !== false) {
        download.save({
          filename: `${file.name}.${file.extension}`,
          blob: response,
        });
      }
    }
  }

  static getSubject(nzb) {
    if (isset(() => nzb.data.nzb[0].head[0].meta)) {
      let titles = nzb.data.nzb[0].head[0].meta.filter((meta) => {
        return isset(() => meta.attr.type) && meta.attr.type === 'title';
      });
      if (isset(() => titles[0]['#text']) && titles[0]['#text'] != '') {
        return titles[0]['#text'];
      }
    }
    if (
      isset(() => nzb.data.nzb[0].file[0].attr.subject) &&
      nzb.data.nzb[0].file[0].attr.subject != ''
    ) {
      return htmlDecode(nzb.data.nzb[0].file[0].attr.subject);
    }
    return nzb.title;
  }

  static getPassword(nzb) {
    let password = false;
    if (nzb.password) return nzb.password;
    if (isset(() => nzb.data.nzb[0].head[0].meta)) {
      let pw = nzb.data.nzb[0].head[0].meta.filter((meta) => {
        return isset(() => meta.attr.type) && meta.attr.type === 'password';
      });
      if (isset(() => pw[0]['#text']) && pw[0]['#text'] != '') {
        password = pw[0]['#text'];
      }
    }
    return password;
  }

  // function to handle form data as string
  static sendFormDataAsString(nzb, details) {
    debugLog.info(
      `${
        analyseURL(nzb.url).basedomain
      }: this domain requires special handling sendFormDataAsString`
    )();
    let formData = '';
    for (let key in this.requestIDs[details.requestId].formData) {
      if (isset(() => this.requestIDs[details.requestId].formData[key][0])) {
        formData += `${key}=${
          this.requestIDs[details.requestId].formData[key][0]
        }&`;
      }
    }
    nzb.formData = formData.replace(/&$/i, '');
    return nzb;
  }

  // function to handle form data as GET
  static sendFormDataAsGET(nzb, details) {
    debugLog.info(
      `${
        analyseURL(nzb.url).basedomain
      }: this domain requires special handling sendFormDataAsGET`
    )();
    const parameters = {};
    const data = this.requestIDs[details.requestId].formData;
    for (var key in data) {
      if (Array.isArray(data[key])) {
        if (/.*\[\]$/.test(key)) {
          parameters[key.match(/(.*)\[\]$/)[1]] = data[key];
        } else {
          parameters[key] = data[key][0];
        }
      } else {
        parameters[key] = data[key];
      }
    }
    nzb.parameters = parameters;
    return nzb;
  }

  // function to handle form data as POST
  static sendFormDataAsPOST(nzb, details) {
    debugLog.info(
      `${
        analyseURL(nzb.url).basedomain
      }: this domain requires special handling sendFormDataAsPOST`
    )();
    nzb.formData = generateFormData(
      this.requestIDs[details.requestId].formData
    );
    return nzb;
  }

  static removeListeners() {
    if (
      browser.webRequest.onHeadersReceived.hasListener(
        onHeadersReceivedEventListener
      )
    ) {
      debugLog.info(
        'removing old event listener for the onHeadersReceived event'
      )();
      browser.webRequest.onHeadersReceived.removeListener(
        onHeadersReceivedEventListener
      );
    }
    if (
      browser.webRequest.onBeforeSendHeaders.hasListener(
        onBeforeSendHeadersEventListener
      )
    ) {
      debugLog.info(
        'removing old event listener for the onBeforeSendHeaders event'
      )();
      browser.webRequest.onBeforeSendHeaders.removeListener(
        onBeforeSendHeadersEventListener
      );
    }
    if (
      browser.webRequest.onBeforeRequest.hasListener(
        onBeforeRequestEventListener
      )
    ) {
      debugLog.info(
        'removing old event listener for the onBeforeRequest event'
      )();
      browser.webRequest.onBeforeRequest.removeListener(
        onBeforeRequestEventListener
      );
    }
    this.requestIDs = [];
  }

  static setListeners(settings) {
    this.removeListeners();
    if (
      isset(() => settings.interception.enabled) &&
      settings.interception.enabled === true &&
      isset(() => settings.interception.domains) &&
      settings.interception.domains.length > 0
    ) {
      // generate the array of domains to be intercepted
      const domains = [];
      for (let key in settings.interception.domains) {
        if (settings.interception.domains[key].active) {
          domains.push(`*://*.${settings.interception.domains[key].domain}/*`);
        }
      }
      // check for the domains lenght -> no domains, no interception!
      if (domains.length > 0) {
        // setting the event listener for all requests to get the request url and form data to be used upon interception
        debugLog.info('Setting event listener for the onBeforeRequest event')();
        browser.webRequest.onBeforeRequest.addListener(
          onBeforeRequestEventListener,
          {
            urls: domains,
          },
          ['requestBody']
        );
        // setting the event listener for the X-NZBDonkey requests to get those request IDs to exclude them from being intercepted
        debugLog.info(
          'Setting event listener for the onBeforeSendHeaders event'
        )();
        browser.webRequest.onBeforeSendHeaders.addListener(
          onBeforeSendHeadersEventListener,
          {
            urls: domains,
          },
          [
            'blocking',
            'requestHeaders',
            chrome.webRequest.OnSendHeadersOptions.EXTRA_HEADERS,
          ].filter(Boolean)
        );
        debugLog.info(
          'Setting event listener for the onHeadersReceived event'
        )();
        browser.webRequest.onHeadersReceived.addListener(
          onHeadersReceivedEventListener,
          {
            urls: domains,
          },
          [
            'blocking',
            'responseHeaders',
            chrome.webRequest.OnSendHeadersOptions.EXTRA_HEADERS,
          ].filter(Boolean)
        );
      } else {
        debugLog.info('No active domains for download interception')();
      }
    } else {
      debugLog.info('NZB file download interception not activated')();
    }
  }

  static async unpack(response) {
    let nzbData = [];
    try {
      debugLog.info(`Extracting files`)();
      Archive.init({
        workerUrl: '/js/worker-bundle.js',
      });
      const archive = await Archive.open(response);
      let files = await archive.extractFiles();
      for (let file in files) {
        // check if file is a nzb file
        if (/.*\.nzb$/i.test(file)) {
          try {
            nzbData.push({
              data: nzb2xml(await this.readFileAsText(files[file])),
              title: file.match(/^(.*?)(?:{{(.*?)}})?(?:\.nzb)?$/)
                ? file.match(/^(.*?)(?:{{(.*?)}})?(?:\.nzb)?$/)[1]
                : file,
              password: file.match(/^(.*?)(?:{{(.*?)}})?(?:\.nzb)?$/)
                ? file.match(/^(.*?)(?:{{(.*?)}})?(?:\.nzb)?$/)[2]
                : false,
            });
          } catch (e) {
            debugLog.error(
              `Error while extracting file "${file}": ${e.message}`
            )();
          }
        }
      }
    } catch (e) {
      debugLog.error(`Error while extracting files: ${e.message}`)();
    }
    return nzbData;
  }

  static readFileAsText(file) {
    return new Promise((res, rej) => {
      let content = new FileReader();
      content.onload = function (event) {
        res(event.target.result);
      };
      content.onerror = function (event) {
        rej(event.target.error);
      };
      content.readAsText(file);
    });
  }
}

import { version } from '../../package.json';
import Vue from 'vue';
import { ValidationObserver, ValidationProvider, extend } from 'vee-validate';
import content from './content.vue';
import settings from '../settings/settings.js';
import debugLog from '../logger/debugLog.js';
import notification from '../background/notification.js';
import html2text from 'html-to-formatted-text';
import { isset, analyzeURL } from '../functions/functions.js';

// set global development and debug mode variables
window.NZBDONKEY_SCRIPT = 'content';
if (process.env.NODE_ENV === 'development') {
  window.NZBDONKEY_DEVELOPMENT = true;
  window.NZBDONKEY_DEBUG = true;
  debugLog.info('[NZBDonkey] INFO - Development mode on')();
}
debugLog.info(`[NZBDonkey] INFO - Content Script v${version}`)();

window.onload = async function () {
  debugLog.info(
    `Initialising the content script on: ${window.location.href}`
  )();
  try {
    await settings.init(false);
    browser.runtime.onMessage.addListener(messageListener);
    if (settings.get().general.catchLinks) {
      document.addEventListener('click', clickListener, true);
    }
    debugLog.info(
      `Content script successfully initialised on: ${window.location.href}`
    )();
  } catch (e) {
    debugLog.error(
      `Error while initialising the content script on "${window.location.href}": ${e.message}`
    )();
    if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
    notification.error(
      `Error while initialising the content script: ${e.message}`
    );
  }
};

async function messageListener(request) {
  try {
    let events = {
      analyseSelection: () => {
        debugLog.info(`Analysing text selection on: ${window.location.href}`)();
        inject(analyseText());
      },
    };
    try {
      if (events[request.action]) {
        events[request.action](request);
        return Promise.resolve(true);
      } else {
        throw new Error(
          `received an unknown request with action: ${request.action}`
        );
      }
    } catch (e) {
      debugLog.error(`Content script error: ${e.message}`)();
      if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
      notification.error(`Content script error: ${e.message}`);
      return Promise.resolve(e);
    }
  } catch (e) {
    debugLog.error(`Content script error: ${e.message}`)();
    if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
    notification.error(`Content script error: ${e.message}`);
  }
}

let lastclick = 0;

function clickListener(e) {
  try {
    const event = e || window.event;
    if (event.timeStamp > lastclick) {
      lastclick = event.timeStamp;
      let target = event.target;
      while (target) {
        if (target instanceof HTMLAnchorElement) {
          if (typeof target.getAttribute('href') === 'string') {
            let url = analyzeURL(target.getAttribute('href').trim());
            if (url.scheme === 'nzblnk') {
              if (
                isset(() => url.parameters) &&
                isset(() => url.parameters.h)
              ) {
                event.preventDefault();
                if (settings.get().general.catchLinksShowDialog) {
                  inject({
                    header: url.parameters.h,
                    title: url.parameters.t
                      ? url.parameters.t
                      : url.parameters.h,
                    password: url.parameters.p,
                    selection: false,
                  });
                } else {
                  browser.runtime.sendMessage({
                    action: 'doTheDonkey',
                    header: url.parameters.h,
                    title: url.parameters.t
                      ? url.parameters.t
                      : url.parameters.h,
                    password: url.parameters.p,
                    source: location.href,
                  });
                }
              } else {
                throw new Error('The clicked NZBLNK link is invalid');
              }
            }
          }
          break;
        }
        target = target.parentNode;
      }
    }
  } catch (e) {
    debugLog.error(`Content script error: ${e.message}`)();
    if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
    notification.error(`Content script error: ${e.message}`);
  }
}

function inject(props) {
  let injected = false;
  if (!injected) {
    const div = document.createElement('div');
    document.body.lastChild.after(div);

    // Validation rules
    // Rule required
    extend('required', {
      validate(value) {
        return {
          required: true,
          valid: ['', null, undefined].indexOf(value) === -1,
        };
      },
      computesRequired: true,
      message: 'This field is required',
    });
    // Register the validaten components globally.
    Vue.component('ValidationProvider', ValidationProvider);
    Vue.component('ValidationObserver', ValidationObserver);
    // Error handler
    Vue.config.errorHandler = (e) => {
      debugLog.error(`Uncought Error: ${e.message}!`)();
      if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
      notification.error(`ERROR: ${e.message}`);
    };
    new Vue({
      el: div,
      render: (h) => {
        return h(content, {
          props: { settings: settings.get(), ...props },
        });
      },
    });
    injected = true;
  }
}

function analyseText() {
  let selection = false,
    header = false,
    password = false,
    title = false;
  selection = html2text(
    getSelectionHTML().replace(
      /<input.+?value\s*?=\s*?['"](.*?)['"].*?>/gi,
      '\n$1\n'
    )
  );
  // test if the selection contains a description for the header starting with some common words used for and ending with a colon or a vertical bar
  if (
    /(?:^\s*(?:header|subje[ck]t|betreff|files?) ?.*?(?::|\s)+)+"?(\S.*\S)"?$/im.test(
      selection
    )
  ) {
    // set the header to the text after the description
    // we search for any text until we find it and then get all of it until the next line break
    // like this we will find the header information either if placed on the same line or if placed on the next line
    // we also take care of if the description is used twice (e.g. before the hidden tag and in the hidden tag again)
    header = selection.match(
      /(?:^\s*(?:header|subje[ck]t|betreff|files?) ?.*?(?::|\s)+)+"?(\S.*\S)"?$/im
    )[1];
  }

  // test if the selection contains a NZB file name in the format of nzbfilename{{password}}
  // we first assume that the NZB file name is on its own line
  if (/^(.*){{(.*?)}}/m.test(selection)) {
    // set the title and password according to the NZB filename
    title = selection.match(/^(.*){{(.*?)}}/m)[1];
    password = selection.match(/^(.*){{(.*?)}}/m)[2];
    // check if maybe there is nevertheless a leading description and remove it from the title
    // assuming that the leading description includes the word NZB and ends with a colon
    if (/.*nzb.*:\s*/i.test(title)) {
      title = title.replace(/.*nzb.*:\s*/i, '');
    }
    // if no NZB file name was found the title and password have to be set by another way
  } else {
    // first check if there is actually a title prefix
    if (selection.match(/(?:^\s?(?:titel|title) ?.*?(?::|\s)+)+(\S.*\S)$/im)) {
      title = selection.match(
        /(?:^\s?(?:titel|title) ?.*?(?::|\s)+)+(\S.*\S)$/im
      )[1];
    } else {
      // if not, simply set title to the first line of the selection
      title = selection.split('\n')[0];
    }
    // test if the selection contains a description for the password starting with some common words used for and ending with a colon or a vertical bar
    if (
      /(?:^\s?(?:passwor[td]|pw|pass) ?.*?(?::|\s)+)+(\S.*\S)$/im.test(
        selection
      )
    ) {
      // set the password to the text after the description
      // we search for any text until we find it and then get all of it until the next line break
      // like this we will find the password either if placed on the same line or if placed on the next line
      // we also take care of if the description is used twice (e.g. before the hidden tag and in the hidden tag again)
      password = selection.match(
        /(?:^\s?(?:passwor[td]|pw|pass) ?.*?(?::|\s)+)+(\S.*\S)$/im
      )[1];
    }
  }
  return {
    selection: selection,
    header: header ? header : title ? title : '',
    password: password ? password : '',
    title: title ? title : '',
  };
}

function getSelectionHTML() {
  let html = '';
  if (typeof window.getSelection !== 'undefined') {
    const sel = window.getSelection();
    if (sel.rangeCount) {
      let container = document.createElement('div');
      for (let i = 0; i < sel.rangeCount; i += 1) {
        container.appendChild(sel.getRangeAt(i).cloneContents());
      }
      html = container.innerHTML;
    }
  }
  return `<div>${html}</div>`;
}

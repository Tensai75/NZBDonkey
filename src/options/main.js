import { version } from '../../package.json';
import Vue from 'vue';
import { ValidationObserver, ValidationProvider, extend } from 'vee-validate';
import App from './App.vue';
import settings from '../settings/settings.js';
import debugLog from '../logger/debugLog.js';
import notification from '../background/notification.js';

window.NZBDONKEY_SCRIPT = 'option';
console.log(`[NZBDonkey] INFO - Option Script v${version}`);

// set global development and debug mode
if (process.env.NODE_ENV === 'development') {
  console.log('[NZBDonkey] INFO - Development mode on');
  window.NZBDONKEY_DEVELOPMENT = true;
  window.NZBDONKEY_DEBUG = true;
}

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

// Rule host
extend('host', {
  validate(value) {
    return {
      required: true,
      valid:
        /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]))*$/.test(
          value
        ),
    };
  },
  computesRequired: true,
  message: 'This is not a valid host name or ip address',
});

// Rule port
extend('port', {
  validate(value) {
    return {
      required: true,
      valid:
        /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/.test(
          value
        ),
    };
  },
  computesRequired: true,
  message: 'This is not a valid port number',
});

// Rule relativePath
extend('relativePath', {
  validate(value) {
    return {
      valid: !/^[\\/]|\.{1,}[\\/]|[:]|[\\/]{2,}|[\\/]$/.test(value),
    };
  },
  computesRequired: true,
  message: 'This is not a valid relative folder path',
});

// Rule url
extend('url', {
  validate(value) {
    return {
      valid:
        /^(?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu.test(
          value
        ),
    };
  },
  computesRequired: true,
  message: 'This is not a valid URL',
});

// Rule number
extend('number', {
  validate(value) {
    return {
      valid: Number.isInteger(value) && value > 0,
    };
  },
  computesRequired: true,
  message: 'This is not a valid number',
});

// Rule percent
extend('percent', {
  validate(value) {
    return {
      valid: Number.isInteger(value) && value <= 100 && value >= 0,
    };
  },
  computesRequired: true,
  message: 'This is not a valid percent number',
});

// Rule regex
extend('regex', {
  validate(value) {
    try {
      const regex = new RegExp(value);
      regex.test('test');
      return { valid: true };
    } catch (e) {
      return { valid: false };
    }
  },
  computesRequired: true,
  message: 'This is not a valid regex expression',
});

// Rule urlID
extend('urlID', {
  validate(value) {
    return { valid: value.indexOf('%s') >= 0 ? true : false };
  },
  computesRequired: true,
  message: 'The "%s" expression is missing',
});

// Rule baseDomain
extend('baseDomain', {
  validate(value) {
    return {
      valid:
        /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]))$/.test(
          value
        ),
    };
  },
  computesRequired: true,
  message: 'This is not a valid base domain',
});

// Register the validaten components globally.
Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);

// Error handler
Vue.config.errorHandler = (e) => {
  debugLog.error(`Uncought Error: ${e.message}!`)();
  if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
  notification.error(e.message);
};

(async () => {
  // load settings
  await settings.init();

  // load app
  new Vue({
    el: '#app',
    render: (h) => h(App),
  });
})();

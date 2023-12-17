import { version } from '../../package.json';
import Vue from 'vue';
import { ValidationObserver, ValidationProvider, extend } from 'vee-validate';
import App from './nzbDialog.vue';
import debugLog from '../logger/debugLog.js';
import notification from '../background/notification.js';
import settings from '../settings/settings.js';

window.NZBDONKEY_SCRIPT = 'nzbdialog';
console.log(`[NZBDonkey] INFO - NZB Dialog Script v${version}`);

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

// Register the validaten components globally.
Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);

// Error handler
Vue.config.errorHandler = (e) => {
  debugLog.error(`Uncought Error: ${e.message}!`)();
  if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
  notification.error(`ERROR: ${e.message}`);
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

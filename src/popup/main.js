import { version } from '../../package.json';
import Vue from 'vue';
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import App from './App.vue';
import debugLog from '../logger/debugLog.js';
import notification from '../background/notification.js';
import settings from '../settings/settings.js';

window.NZBDONKEY_SCRIPT = 'action';
console.log(`[NZBDonkey] INFO - Browser Action Script v${version}`);

// set global development and debug mode
if (process.env.NODE_ENV === 'development') {
  console.log('[NZBDonkey] INFO - Development mode on');
  window.NZBDONKEY_DEVELOPMENT = true;
  window.NZBDONKEY_DEBUG = true;
}

// Register the validaten components globally.
Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);

// Error handler
Vue.config.errorHandler = (e) => {
  debugLog.error(`Uncought error: ${e.message}!`)();
  if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
  notification.error(
    `${chrome.i18n.getMessage('general_error')}: ${e.message}`
  );
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

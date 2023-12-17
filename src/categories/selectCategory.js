import Vue from 'vue';
import App from './selectCategory.vue';
import debugLog from '../logger/debugLog.js';
import notification from '../background/notification.js';

// Error handler
Vue.config.errorHandler = (e) => {
  debugLog.error(`Uncought Error: ${e.message}!`)();
  if (window.NZBDONKEY_DEVELOPMENT) console.log(e);
  notification.error(`ERROR: ${e.message}`);
};

new Vue({
  el: '#app',
  render: (h) => h(App),
});

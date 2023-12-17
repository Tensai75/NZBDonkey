import defaultSettings from './defaultSettings.js';
import { isset } from '../functions/functions.js';
import { version } from '../../package.json';
import debugLog from '../logger/debugLog.js';
import nzbLog from '../logger/nzbLog.js';

async function init(setListener = true) {
  await load();
  if (setListener) {
    debugLog.info('Initializing onChange listener for the settings')();
    browser.storage.onChanged.addListener(function (changes) {
      debugLog.info('Settings were changed')();
      if (process.env.NODE_ENV === 'development') {
        console.log('[NZBDonkey] INFO - Changes:', changes);
      }
      load();
    });
  }
}

function get() {
  return window.NZBDONKEY_SETTINGS;
}

async function save(settings) {
  debugLog.info('Saving settings')();
  settings.version = version;
  await storage().set(settings);
  setGlobalValues(settings);
}

async function load() {
  debugLog.info('Loading settings')();
  let settings = await storage().get(defaultSettings);
  if (!settings.version || settings.version < version) {
    // TODO: some settings update magic

    debugLog.info(`Settings were updated to newest version ${version}`)();
    save(settings);
  } else {
    setGlobalValues(settings);
  }
  debugLog.info('Settings loaded')();
  if (process.env.NODE_ENV === 'development') {
    console.log('[NZBDonkey] INFO - Loaded settings:', get());
  }
}

function storage() {
  if (isset(() => browser.storage.sync)) {
    return browser.storage.sync;
  } else if (isset(() => browser.storage.local)) {
    return browser.storage.local;
  } else {
    throw new Error(
      'Your browser does not support neither storage.sync nor storage.local to store the settings!'
    );
  }
}

function setGlobalValues(settings) {
  // set global settings
  window.NZBDONKEY_SETTINGS = settings;
  // set global debug mode
  if (settings.general.debug) {
    window.NZBDONKEY_DEBUG = true;
  }
  // clear logs if deactivated
  if (!settings.general.debug) {
    debugLog.clear();
  }
  if (!settings.general.nzbLog) {
    nzbLog.clear();
  }
  // for development
  if (process.env.NODE_ENV === 'development') {
    window.NZBDONKEY_DEVELOPMENT = true;
    window.NZBDONKEY_DEBUG = true;
  }
}

function reset() {
  storage().clear();
  save(defaultSettings);
}

export default { init, get, save, reset };
export { init, get, save, reset };

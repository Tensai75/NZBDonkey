import { db } from './database.js';

function init() {}

function log(type, source, text, message) {
  if (
    window.NZBDONKEY_DEVELOPMENT ||
    window.NZBDONKEY_DEBUG ||
    type === 'error'
  ) {
    if (message || source === 'background') {
      db.debugLog.add({
        date: Date.now(),
        type: type,
        source: source,
        text: text,
      });
      return console[type].bind(
        window.console,
        `[NZBDonkey] ${type.toUpperCase()} - ${
          text.charAt(0).toUpperCase() + text.slice(1)
        } (from ${source})`
      );
    } else {
      chrome.runtime.sendMessage({
        action: 'debugLog',
        type: type,
        source: source,
        text: text,
      });
    }
  }
  return () => true;
}

async function get() {
  let debugLog = db.debugLog.orderBy('date').toArray();
  return debugLog;
}

function clear() {
  log('info', window.NZBDONKEY_SCRIPT, `Clearing the debug log`)();
  db.debugLog.clear();
}

export default {
  init,
  info: (text, source = window.NZBDONKEY_SCRIPT, message = false) =>
    log('info', source, text, message),
  warn: (text, source = window.NZBDONKEY_SCRIPT, message = false) =>
    log('warn', source, text, message),
  error: (text, source = window.NZBDONKEY_SCRIPT, message = false) =>
    log('error', source, text, message),
  get,
  clear,
};

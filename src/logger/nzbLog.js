import { db } from './database.js';
import { isset } from '../functions/functions.js';
import debugLog from './debugLog';

function init() {}

var nzbID = 0;

async function log(nzb, status, error = '') {
  if (window.NZBDONKEY_SETTINGS.general.nzbLog) {
    var items = {
      date: Date.now(),
      title: nzb.title ? nzb.title : '',
      header: nzb.header ? nzb.header : '',
      password: nzb.password ? nzb.password : '',
      category: nzb.category ? nzb.category : '',
      source: nzb.source ? nzb.source : '',
      engine: nzb.engine ? nzb.engine : '',
      filepath: nzb.filepath ? nzb.filepath : '',
      target: isset(
        () => window.NZBDONKEY_SETTINGS.target.targets[nzb.target].name
      )
        ? window.NZBDONKEY_SETTINGS.target.targets[nzb.target].name
        : '',
      status: status,
      error: error,
    };
    if (nzb.id) {
      items.id = nzb.id;
    }
    let id = await db.nzbLog.put(items);
    return id;
  }
  return nzbID++;
}

async function get() {
  let nzbLog = db.nzbLog.orderBy('id').toArray();
  return nzbLog;
}

async function count() {
  return db.nzbLog.count();
}

function clear() {
  debugLog.info(`Clearing the NZB log`)();
  db.nzbLog.clear();
}

export default {
  init,
  log,
  get,
  clear,
  count,
};

import Dexie from 'dexie';

export const db = new Dexie('nzbdonkey');
db.version(1).stores({
  debugLog: '++id, date, type, source, text', // Primary key and indexed props
  nzbLog:
    '++id, date, title, header, password, category, source, engine, searchURL, target, status, error', // Primary key and indexed props
});

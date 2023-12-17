import download from './download/index.js';
import nzbget from './nzbget/index.js';
import sabnzbd from './sabnzbd/index.js';
import synology from './synology/index.js';
import premiumize from './premiumize/index.js';
import jdownloader from './jdownloader/index.js';
import functions from './functions.js';

const targets = {
  download,
  nzbget,
  sabnzbd,
  synology,
  premiumize,
  jdownloader,
};

const targetsFunctions = {
  ...functions,
};

export default { targets, targetsFunctions };
export { targets, targetsFunctions };

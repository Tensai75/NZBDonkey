import debugLog from '../../logger/debugLog.js';
import defaultSettings from './settings.js';
import {
  myFetch,
  JSONparse,
  generateFormData,
  isset,
} from '../../functions/functions.js';

export default class target {
  static targetSettings = defaultSettings;

  constructor(nzb) {
    this.nzb = nzb;
    if (isset(() => nzb.settings.target.targets[nzb.target].settings)) {
      this.targetSettings = nzb.settings.target.targets[nzb.target].settings;
    } else {
      throw new Error('Target settings are missing');
    }
  }

  static setOptions(settings = target.targetSettings) {
    let options = {
      scheme: 'https',
      host: 'www.premiumize.me',
      responseType: 'text',
      timeout: settings.timeout ? settings.timeout : 5000,
    };
    options.data = generateFormData({
      customer_id: settings.username,
      pin: settings.password,
    });
    return options;
  }

  static async connect(options) {
    const response = JSONparse(await myFetch(options));
    if (isset(() => response.status) && response.status === 'success') {
      return response;
    } else if (isset(() => response.status) && response.status === 'error') {
      throw new Error(response.message ? response.message : 'unknown Error');
    } else {
      throw new Error('unknown Error');
    }
  }

  async push(nzb = this.nzb, settings = this.targetSettings) {
    try {
      let file = new Blob([nzb.file], {
        type: 'application/octet-stream',
      });
      let options = target.setOptions(settings);
      options.basepath = 'api/transfer/create';
      options.data.append('password', nzb.password);
      options.data.append('src', file, nzb.title + '.nzb');
      const response = JSONparse(await myFetch(options));
      if (response.status === 'success') {
        nzb.success();
      } else if (response.status === 'error') {
        throw Error(response.message);
      } else {
        throw Error('Unknown Error');
      }
    } catch (e) {
      debugLog.error(
        `Error while pushing the NZB file for ${nzb.title} to www.premiumize.me: ${e.message}`
      )();
      throw e;
    }
  }

  static async testconnection(settings = target.targetSettings) {
    try {
      debugLog.info('Testing connection to www.premiumize.me')();
      let options = target.setOptions(settings);
      options.basepath = 'api/account/info';
      const response = JSONparse(await myFetch(options));
      if (response.status === 'success') {
        debugLog.info(
          'Testing connection to www.premiumize.me was succesfull'
        )();
        return true;
      } else if (response.status === 'error') {
        throw Error(response.message);
      } else {
        throw Error('Unknown Error');
      }
    } catch (e) {
      debugLog.error(
        `Error while testing connetion to www.premiumize.me: ${e.message}`
      )();
      throw e;
    }
  }
}

import debugLog from '../../logger/debugLog.js';
import defaultSettings from './settings.js';
import {
  myFetch,
  JSONparse,
  isset,
  b64EncodeUnicode,
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
      scheme: settings.scheme,
      host: settings.host,
      port: settings.port,
      username: settings.username,
      password: settings.password,
      path: 'jsonrpc/',
      responseType: 'text',
      timeout: settings.timeout ? settings.timeout : 1200000,
    };
    if (settings.basepath && settings.basepath != '') {
      options.basepath = settings.basepath.match(/^\/*(.*?)\/*$/)[1] + '/';
    }
    return options;
  }

  static async connect(options) {
    try {
      const response = JSONparse(await myFetch(options));
      if (isset(() => response.result)) {
        return response.result;
      } else {
        if (isset(() => response.error)) {
          throw new Error(`${response.error.code} - ${response.error.message}`);
        } else {
          throw new Error('Unknown Error');
        }
      }
    } catch (e) {
      debugLog.error(`Error while connecting to NZBGet: ${e.message}`)();
      throw e;
    }
  }

  async push(nzb = this.nzb, settings = this.targetSettings) {
    try {
      debugLog.info('Pushing the NZB file to NZBGet')();
      let options = target.setOptions(settings);
      let params = [
        nzb.title, // Filename
        b64EncodeUnicode(nzb.file), // Content (NZB File)
        nzb.category !== false ? nzb.category : '', // Category
        0, // Priority
        false, // AddToTop
        settings.addPaused, // AddPaused
        '', // DupeKey
        0, // DupeScore
        'Force', // DupeMode
        [
          { '*unpack:password': nzb.password !== false ? nzb.password : '' }, // Post processing parameter: Password
        ],
      ];
      options.data = JSON.stringify({
        version: '1.1',
        id: 1,
        method: 'append',
        params: params,
      });
      if (await target.connect(options)) {
        nzb.success();
        return true;
      } else {
        throw new Error('Unknown Error');
      }
    } catch (e) {
      debugLog.error(
        'Error while pushing the NZB file to NZBGet: ' + e.message
      )();
      throw e;
    }
  }

  static async testconnection(settings = target.targetSettings) {
    debugLog.info('Testing connection to NZBGet')();
    try {
      let options = target.setOptions(settings);
      options.data = JSON.stringify({
        version: '1.1',
        id: 1,
        method: 'version',
      });
      if (await target.connect(options)) {
        return true;
      } else {
        throw new Error('Unknown Error');
      }
    } catch (e) {
      debugLog.error(
        'Error while testing connection to NZBGet: ' + e.message
      )();
      throw e;
    }
  }

  static async getCategories(settings = target.targetSettings) {
    debugLog.info('Getting the categories from NZBGet')();
    try {
      let options = target.setOptions(settings);
      options.data = JSON.stringify({
        version: '1.1',
        id: 1,
        method: 'config',
      });
      const response = await target.connect(options);
      var categories = [];
      response.forEach(function (element) {
        if (element.Name.match(/^category\d+\.name$/i)) {
          categories.push(element.Value);
        }
      });
      return categories;
    } catch (e) {
      debugLog.error(
        'Error while getting the categories from NZBGet: ' + e.message
      )();
      throw e;
    }
  }
}

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
      scheme: settings.scheme,
      host: settings.host,
      port: settings.port,
      username: settings.username,
      password: settings.password,
      path: 'api',
      timeout: settings.timeout ? settings.timeout : 5000,
    };
    if (settings.basepath && settings.basepath != '') {
      options.basepath = settings.basepath.match(/^\/*(.*?)\/*$/)[1] + '/';
    }
    return options;
  }

  static async connect(options) {
    try {
      return JSONparse(await myFetch(options));
    } catch (e) {
      debugLog.error('Error while connecting to Sabnzbd: ' + e.message)();
      throw e;
    }
  }

  async push(nzb = this.nzb, settings = this.targetSettings) {
    debugLog.info('Pushing the NZB file to Sabnzbd')();
    try {
      let options = target.setOptions(settings);
      let content = new Blob([nzb.file], {
        type: 'text/xml',
      });
      let filename = nzb.title;
      if (isset(() => nzb.password) && nzb.password !== '') {
        filename += '{{' + nzb.password + '}}';
      }
      const addPaused = settings.addPaused ? -2 : -100;
      const formData = {
        mode: 'addfile',
        output: 'json',
        apikey: settings.apiKey,
        nzbname: filename,
        cat: nzb.category,
        priority: addPaused,
        name: [content, filename],
      };
      options.data = generateFormData(formData);
      let response = await target.connect(options);
      if (isset(() => response.status) && response.status) {
        debugLog.info('Successfully pushed the NZB file to Sabnzbd')();
        return true;
      } else {
        if (isset(() => response.error)) {
          throw new Error(response.error);
        } else {
          throw new Error('Unknown Error');
        }
      }
    } catch (e) {
      debugLog.error(
        'Error while pushing the NZB file to Sabnzbd: ' + e.message
      )();
      throw e;
    }
  }

  static async testconnection(settings = target.targetSettings) {
    debugLog.info('Testing connection to Sabnzbd')();
    try {
      let options = target.setOptions(settings);
      let formData = {
        mode: 'addurl',
        output: 'json',
        apikey: settings.apiKey,
        name: '',
      };
      options.data = generateFormData(formData);
      let response = await target.connect(options);
      if (isset(() => response.status) && response.status) {
        debugLog.info('Testing connection to Sabnzbd was successfull')();
        return true;
      } else {
        if (isset(() => response.error)) {
          // Sabnzbd 3.0.0+ does no longer responde with success=true but if name is empty, the error message will be "expects one parameter"
          if (response.error == 'expects one parameter') {
            debugLog.info('Testing connection to Sabnzbd was successfull')();
            return true;
          } else {
            throw new Error(response.error);
          }
        } else {
          throw new Error('Unknown Error');
        }
      }
    } catch (e) {
      debugLog.error(
        'Error while testing connection to Sabnzbd: ' + e.message
      )();
      throw e;
    }
  }

  static async getCategories(settings = target.targetSettings) {
    debugLog.info('Getting the categories from Sabnzbd')();
    try {
      let options = target.setOptions(settings);
      let formData = {
        mode: 'get_cats',
        output: 'json',
        apikey: settings.apiKey,
        name: '',
      };
      options.data = generateFormData(formData);
      const response = await target.connect(options);
      if (isset(() => response.categories)) {
        let index = response.categories.indexOf('*');
        if (index > -1) {
          response.categories.splice(index, 1);
        }
        return response.categories;
      } else {
        // Is this possible? Let's return an empty array anyway.
        return [];
      }
    } catch (e) {
      debugLog.error(
        'Error while getting the categories from Sabnzbd: ' + e.message
      )();
      throw e;
    }
  }
}

import debugLog from '../../logger/debugLog.js';
import defaultSettings from './settings.js';
import { isset, b64EncodeUnicode } from '../../functions/functions.js';
import jdownloader from './jdownloader-api.js';

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

  async push(nzb = this.nzb, settings = this.targetSettings) {
    let result;
    let disconnected = false;
    try {
      debugLog.info(
        `Pushing the NZB file to to ${
          nzb.settings.target.targets[nzb.target].name
        }`
      )();
      let params = {
        packageName: nzb.title,
        extractPassword: nzb.password !== false ? nzb.password : '',
        dataURLs: [`data:application/nzb;base64,${b64EncodeUnicode(nzb.file)}`],
        autostart: !settings.addPaused,
        priority: 'DEFAULT',
      };
      await jdownloader.connect(settings.username, settings.password);
      result = await jdownloader.addLinksRaw(params, settings.device.id);
      disconnected = await jdownloader.disconnect();
      nzb.success();
      return true;
    } catch (e) {
      debugLog.error(
        `Error while pushing the NZB file for "${nzb.title}" to ${
          nzb.settings.target.targets[nzb.target].name
        }: ${e.message}`
      )();
      if (disconnected === false) {
        try {
          disconnected = await jdownloader.disconnect();
        } catch (e) {
          debugLog.error(
            `Error while trying to close the connection to ${
              nzb.settings.target.targets[nzb.target].name
            }`
          )();
        }
      }
      throw new Error(
        `Error while pushing the NZB file for "${nzb.title}" to ${
          nzb.settings.target.targets[nzb.target].name
        }: ${e.message}`
      );
    }
  }

  static async testconnection(settings = target.targetSettings) {
    debugLog.info('Testing connection to JDownloader')();
    try {
      await jdownloader.connect(settings.username, settings.password);
      await jdownloader.disconnect();
    } catch (e) {
      debugLog.error(
        'Error while testing connection to JDownloader: ' + e.message
      )();
      throw e;
    }
  }

  static async getDevices(settings = target.targetSettings) {
    debugLog.info('Getting devices from JDownloader')();
    try {
      await jdownloader.connect(settings.username, settings.password);
      let devices = await jdownloader.listDevices();
      await jdownloader.disconnect();
      return devices;
    } catch (e) {
      debugLog.error('Error while getting devices JDownloader: ' + e.message)();
      throw e;
    }
  }
}

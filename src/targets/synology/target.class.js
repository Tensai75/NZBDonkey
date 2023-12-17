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
  static SynologyErrorCodes = {
    100: 'Unknown error.',
    101: 'No parameter of API, method or version.',
    102: 'The requested API does not exist.',
    103: 'The requested method does not exist.',
    104: 'The requested version does not support the functionality.',
    105: 'The logged in session does not have permission.',
    106: 'Session timeout.',
    107: 'Session interrupted by duplicated login.',
    108: 'Failed to upload the file.',
    109: 'The network connection is unstable or the system is busy.',
    110: 'The network connection is unstable or the system is busy.',
    111: 'The network connection is unstable or the system is busy.',
    112: 'Preserve for other purpose.',
    113: 'Preserve for other purpose.',
    114: 'Lost parameters for this API.',
    115: 'Not allowed to upload a file.',
    116: 'Not allowed to perform for a demo site.',
    117: 'The network connection is unstable or the system is busy.',
    118: 'The network connection is unstable or the system is busy.',
    119: 'Invalid session.',
    400: 'No such account or incorrect password.',
    401: 'Disabled account.',
    402: 'Denied permission.',
    403: '2-factor authentication code required.',
    404: 'Failed to authenticate 2-factor authentication code.',
    406: 'Enforce to authenticate with 2-factor authentication code.',
    407: 'Blocked IP source.',
    408: 'Expired password cannot change.',
    409: 'Expired password.',
    410: 'Password must be changed.',
  };
  static downloadStation = {
    maxVersion: 1,
    path: '',
  };

  constructor(nzb) {
    this.nzb = nzb;
    if (isset(() => nzb.settings.target.targets[nzb.target].settings)) {
      this.targetSettings = nzb.settings.target.targets[nzb.target].settings;
    } else {
      throw new Error('Target settings are missing');
    }
  }

  static setOptions(settings = target.defaultSettings) {
    let options = {
      scheme: settings.scheme,
      host: settings.host,
      port: settings.port,
      basepath:
        (settings.basepath
          ? settings.basepath.match(/^\/*(.*?)\/*$/)[1] + '/'
          : '') + 'webapi/',
      username: settings.basicAuthUsername ? settings.basicAuthUsername : false,
      password: settings.basicAuthPassword ? settings.basicAuthPassword : false,
      path: settings.path ? settings.path : 'query.cgi',
      timeout: settings.timeout ? settings.timeout : 5000,
    };
    return options;
  }

  static checkError(SynoData) {
    if (isset(() => SynoData.error.code)) {
      throw new Error(
        'API error code: ' +
          SynoData.error.code +
          (isset(() => target.SynologyErrorCodes[SynoData.error.code])
            ? ' - ' + target.SynologyErrorCodes[SynoData.error.code]
            : '')
      );
    } else {
      throw new Error('Unreadable response!');
    }
  }

  static async authenticate(settings = target.defaultSettings) {
    let options = target.setOptions(settings);
    options.parameters = {
      api: 'SYNO.API.Info',
      version: 1,
      method: 'query',
      query: 'SYNO.API.Auth,SYNO.DownloadStation2.Task',
    };
    let SynoData = JSONparse(await myFetch(options));
    if (isset(() => SynoData.success) && SynoData.success === true) {
      target.downloadStation.path =
        SynoData.data['SYNO.DownloadStation2.Task'].path;
      target.downloadStation.maxVersion =
        SynoData.data['SYNO.DownloadStation2.Task'].maxVersion;
      options.path = SynoData.data['SYNO.API.Auth'].path;
      options.parameters = {
        api: 'SYNO.API.Auth',
        version: SynoData.data['SYNO.API.Auth'].maxVersion,
        method: 'login',
        account: encodeURIComponent(settings.username),
        passwd: encodeURIComponent(settings.password),
        session: 'DownloadStation',
        format: 'sid',
      };
      SynoData = JSONparse(await myFetch(options));
      if (isset(() => SynoData.success) && SynoData.success === true) {
        return SynoData.data.sid;
      }
    }
    target.checkError(SynoData);
  }

  async push(nzb = this.nzb, settings = this.targetSettings) {
    debugLog.info('Pushing NZB file to Synology Diskstation')();
    try {
      const sid = await target.authenticate(settings);
      const content = new Blob([nzb.file], {
        type: 'text/xml',
      });
      const formData = {
        api: 'SYNO.DownloadStation2.Task',
        method: 'create',
        version: target.downloadStation.maxVersion,
        type: '"file"',
        destination: '""',
        create_list: false,
        mtime: Date.now(),
        size: content.size,
        file: '["torrent"]',
        extract_password: '"' + nzb.password + '"',
        torrent: [content, nzb.title + '.nzb'],
      };
      let options = target.setOptions(settings);
      options.path = target.downloadStation.path;
      options.parameters = { _sid: sid };
      options.data = generateFormData(formData);
      options.timeout = 180000;
      let SynoData = JSONparse(await myFetch(options));
      if (isset(() => SynoData.success) && SynoData.success === true) {
        nzb.success();
        return true;
      }
      target.checkError(SynoData);
    } catch (e) {
      debugLog.error(
        'Error while pushing nzb file to Synology Diskstation: ' + e.message
      )();
      throw e;
    }
  }

  static async testconnection(settings = target.defaultSettings) {
    debugLog.info('Testing connection to Synology Diskstation')();
    try {
      await target.authenticate(settings);
      debugLog.info(
        'Testing connection to Synology Diskstation was successfull'
      )();
      return true;
    } catch (e) {
      debugLog.error(
        'Error while testing connection to Synology Diskstation: ' + e.message
      )();
      throw e;
    }
  }
}

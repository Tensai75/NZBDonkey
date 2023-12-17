import sanitize from 'sanitize-filename';
import debugLog from '../../logger/debugLog.js';
import defaultSettings from './settings.js';
import { isset } from '../../functions/functions.js';
import notification from '../../background/notification.js';
export default class target {
  targetSettings = defaultSettings;
  boundOnCreatedListener = this.onCreatedListener.bind(this);
  boundOnChangeListener = this.onChangeListener.bind(this);

  constructor(nzb) {
    this.nzb = nzb;
    if (isset(() => nzb.settings.target.targets[nzb.target].settings)) {
      this.targetSettings = nzb.settings.target.targets[nzb.target].settings;
    } else {
      throw new Error('Target settings are missing');
    }
  }

  async push(nzb = this.nzb, settings = this.targetSettings) {
    this.nzb.filepath = this.getFilename(nzb, settings);
    const blob = new Blob([nzb.file], {
      type: 'text/nzb;charset=utf-8',
    });
    browser.downloads.onCreated.addListener(this.boundOnCreatedListener);
    browser.downloads.onChanged.addListener(this.boundOnChangeListener);
    target.save(
      {
        filename: this.nzb.filepath,
        blob: blob,
        saveAs: settings.saveAs,
        conflictAction: 'uniquify',
      },
      nzb
    );
  }

  getFilename(nzb = this.nzb, settings = this.targetSettings) {
    let filename = '';
    if (settings.defaultPath !== '') {
      filename += settings.defaultPath.replace(/^[/]*(.*)[/]*$/, '$1') + '/';
    }
    if (nzb.category !== false && settings.useCategories) {
      // sanitize category
      filename +=
        nzb.category.replace(/[/\\?%*:|"<>\r\n\t\0\v\f\u200B]/g, '') + '/';
    }
    // filename is already sanitized
    filename += nzb.title;
    if (nzb.password) {
      if (!/[/\\%*:"?~<>*|]/.test(nzb.password)) {
        filename += '{{' + nzb.password + '}}';
      } else {
        debugLog.warn(
          'The Password does contain invalid characters and cannot be included in the filename'
        )();
        filename += '_ERR_INV_CHAR_IN_PW';
      }
    }
    filename += '.nzb';
    debugLog.info('Filename is set to' + ': ' + filename)();
    return filename;
  }

  static async save(
    { filename, blob, saveAs = true, conflictAction = 'uniquify' },
    nzb = false
  ) {
    try {
      const id = await browser.downloads.download({
        conflictAction: conflictAction,
        filename: filename,
        saveAs: saveAs,
        url: URL.createObjectURL(blob),
      });
      if (typeof id === 'undefined') {
        debugLog.info(`Failed to initiate the download for "${filename}"`)();
        throw new Error(browser.runtime.lastError.message);
      } else {
        debugLog.info(`Initiated the download for "${filename}"`)();
      }
    } catch (e) {
      if (nzb) {
        nzb.error(
          new Error(
            `Error while downloading the NZB file for "${nzb.title}": ${e.message}`
          )
        );
      } else {
        debugLog.error(`Error while saving the file to disk: ${e.message}`)();
        notification.error(`Error while saving the file to disk: ${e.message}`);
      }
    }
  }

  onChangeListener(details) {
    try {
      if (isset(() => details.filename.current)) {
        this.nzb.filepath = details.filename.current;
      } else if (isset(() => details.state.current)) {
        browser.downloads.onChanged.removeListener(this.boundOnChangeListener);
        if (details.state.current === 'complete') {
          this.nzb.success(
            `NZB file for "${this.nzb.title}" successfully downloaded`
          );
        } else if (details.state.current === 'interrupted') {
          if (isset(() => details.error.current)) {
            if (details.error.current.match(/^user/i)) {
              throw new Error('Download was canceled by the user');
            } else if (details.error.current.match(/^file/i)) {
              throw new Error('Error while saving the NZB file to disk');
            } else {
              throw new Error('Unknown Error');
            }
          }
        }
      }
    } catch (e) {
      this.nzb.error(
        new Error(
          `Error while downloading the NZB file for "${this.nzb.title}": ${e.message}`
        )
      );
    }
  }

  onCreatedListener(details) {
    if (details.filename) {
      this.nzb.filepath = details.filename;
      browser.downloads.onCreated.removeListener(this.boundOnCreatedListener);
    }
  }
}

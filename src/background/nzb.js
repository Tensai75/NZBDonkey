import { version } from '../../package.json';
import debugLog from '../logger/debugLog.js';
import nzbLog from '../logger/nzbLog.js';
import settings from '../settings/settings.js';
import notification from './notification';
import searchengines from '../searchengines/functions.js';
import categories from '../categories/functions.js';
import validatenzb from './validatenzb.js';
import { targets, targetsFunctions } from '../targets/index.js';
import { isset } from '../functions/functions.js';
import parser from 'fast-xml-parser';

// modify the promise prototype to add function "any"
// from https://stackoverflow.com/questions/39940152/get-first-fulfilled-promise
Promise.prototype.invert = function () {
  return new Promise((res, rej) => this.then(rej, res));
};
// small adjustment: the array used here is an array of functions returning a promise
// hence the individual promises must be called as a function
Promise.myAny = function (ps) {
  return Promise.all(ps.map((p) => p().invert())).invert();
};

export default class NZB {
  constructor(obj) {
    this.header =
      typeof obj.header === 'string' && obj.header.length > 0
        ? obj.header
        : false;
    this.title =
      typeof obj.title === 'string' && obj.title.length > 0 ? obj.title : false;
    this.password =
      typeof obj.password === 'string' && obj.password.length > 0
        ? obj.password
        : false;
    this.category = typeof obj.category === 'string' ? obj.category : false;
    this.data = typeof obj.data === 'object' && obj.data.nzb ? obj.data : false;
    this.source =
      typeof obj.source === 'string' && obj.source.length > 0
        ? obj.source
        : false;
    this.engine =
      typeof obj.engine === 'string' && obj.engine.length > 0
        ? obj.engine
        : false;
    this.target = typeof obj.target === 'number' ? obj.target : false;
    this.file = false;
    this.settings = settings.get();
    if (!this.title && this.header) this.title = this.header;
  }

  async getNZB() {
    if (!this.id) this.id = await nzbLog.log(this, 'initialized');
    try {
      if (!this.data) {
        if (!this.header) {
          throw new Error(chrome.i18n.getMessage('error_noHeader'));
        } else {
          nzbLog.log(this, 'searching');
          await this.searchNZB();
        }
      } else if (!this.title) {
        throw new Error(chrome.i18n.getMessage('error_noTitle'));
      }
      nzbLog.log(this, 'fetched');
      this.processTitle();
      this.processPassword();
      this.generateXML();
      if (this.target === false) await this.setTarget();
      if (this.category === false) await this.setCategory();
      if (this.category === '') this.category = false;
      nzbLog.log(this, 'pushing');
      await this.pushToTarget();
      if (window.NZBDONKEY_DEVELOPMENT) console.log(this);
      nzbLog.log(this, 'success');
    } catch (e) {
      this.error(e);
    }
  }

  async searchNZB() {
    try {
      this.info(chrome.i18n.getMessage('info_searchingNzbFileFor', this.title));
      // create the search promises
      let searches = [];
      for (let engine of this.settings.searchengines.engines) {
        if (engine.active) {
          const f = () => {
            return new Promise((res, rej) => {
              let data = false;
              searchengines
                .getNZB(this.header, engine)
                .then((response) => {
                  data = response;
                  return this.validate(data, engine);
                })
                .then(() => {
                  res({ success: true, data: data, engine: engine.name });
                })
                .catch((e) => {
                  rej({ success: false, error: e, engine: engine.name });
                });
            });
          };
          searches.push(f);
        }
      }
      if (searches.length == 0) {
        throw new Error(chrome.i18n.getMessage('error_noActiveSearchEngines'));
      }
      switch (this.settings.searchengines.searchOrder) {
        case 'sequential':
          debugLog.info(chrome.i18n.getMessage('debug_searchModeSequential'))();
          // lets loop through the promises one after the other
          for (let data of searches) {
            try {
              let response = await data();
              this.data = response.data;
              this.engine = response.engine;
              break;
            } catch (e) {
              debugLog.warn(
                chrome.i18n.getMessage(
                  'debug_ignoringResultFromSearchEngine',
                  e.engine
                )
              )();
            }
          }
          if (this.data === false)
            throw new Error(
              chrome.i18n.getMessage('error_noSearchEngineReturnedAResult')
            );
          break;
        case 'parallel':
          debugLog.info(`Search mode is set to parallel`)();
          // lets 'race' the promises and get the result from the first resolved promise
          try {
            let response = await Promise.myAny(searches);
            this.data = response.data;
            this.engine = response.engine;
          } catch (e) {
            throw new Error(
              chrome.i18n.getMessage('error_noSearchEngineReturnedAResult')
            );
          }
          break;
      }
      debugLog.info(
        chrome.i18n.getMessage(
          'debug_usingTheNzbFileFromSearchEngine',
          this.engine
        )
      )();
    } catch (e) {
      debugLog.error(
        chrome.i18n.getMessage('error_whileSearchingNzbFile', [
          this.title,
          e.message,
        ])
      )();
      throw e;
    }
  }

  validate(data, engine) {
    if (
      this.settings.completeness.fileCheck ||
      this.settings.completeness.segmentCheck
    ) {
      debugLog.info(
        chrome.i18n.getMessage(
          'debug_checkingTheNzbFileForCompleteness',
          engine.name
        )
      )();
      try {
        let result = validatenzb(data);
        debugLog.info(
          chrome.i18n.getMessage('debug_completnessCheckResults', engine.name) +
            ':' +
            chrome.i18n.getMessage('general_files') +
            ' (' +
            result.filesTotal +
            '/' +
            result.filesExpected +
            ') / ' +
            chrome.i18n.getMessage('general_segments') +
            ' (' +
            result.segmentsTotal +
            '/' +
            result.segmentsExpected +
            ')'
        )();
        if (isset(() => result.complete) && result.complete) {
          debugLog.info(
            chrome.i18n.getMessage(
              'debug_searchEngineReturnedACompleteNzbFile',
              engine.name
            )
          )();
          return true;
        } else if (isset(() => result.error)) {
          throw new Error(result.error);
        }
      } catch (e) {
        debugLog.warn(
          chrome.i18n.getMessage('debug_errorWhileCheckingForCompleteness', [
            engine.name,
            e.message,
          ])
        )();
        throw e;
      }
    }
    debugLog.info(chrome.i18n.getMessage('debug_completenessCheckDisabled'))();
    return true;
  }

  async setTarget() {
    try {
      debugLog.info(
        chrome.i18n.getMessage('debug_settingTheTargetForNzbFile')
      )();
      if (this.settings.target.allowMultipleTargets) {
        this.target = await targetsFunctions.select(this);
      } else {
        this.target = this.settings.target.defaultTarget;
      }
      debugLog.info(
        chrome.i18n.getMessage(
          'debug_targetForNzbFileSetTo',
          this.settings.target.targets[this.target].name
        )
      )();
    } catch (e) {
      debugLog.error(
        chrome.i18n.getMessage('error_whileSettingTheTarget', [
          this.title,
          e.message,
        ])
      )();
      throw e;
    }
  }

  async setCategory() {
    try {
      debugLog.info(
        chrome.i18n.getMessage('debug_settingTheCategoryForNzbFile')
      )();
      this.category = await categories.getCategory(this.target, this.title);
      if (this.category) {
        debugLog.info(
          chrome.i18n.getMessage('debug_categoryForNzbFileSetTo', this.category)
        )();
      }
    } catch (e) {
      debugLog.error(
        chrome.i18n.getMessage('error_whileSettingTheCategory', e.message)
      )();
      // don't throw the error, it's not essential
      // throw e;
    }
  }

  processTitle() {
    debugLog.info(
      chrome.i18n.getMessage('debug_processingTheTitleForNzbFile', this.title)
    );
    try {
      // sanitize title
      this.title = this.title.replace(
        /(?:^[. ]+)|[/\\?%*:|"<>\r\n\t\0\v\f\u200B]/g,
        ''
      );
      if (this.settings.processing.processTitel) {
        // convert periods to spaces or vice versa
        switch (this.settings.processing.processTitel.type) {
          case 'periods':
            this.title = this.title.replace(/\s/g, '.');
            break;
          case 'spaces':
            this.title = this.title.replace(/\./g, ' ');
            break;
        }
      }
    } catch (e) {
      debugLog.error(
        chrome.i18n.getMessage('error_whileProcessingTitleForNzbFile', [
          this.title,
          e.message,
        ])
      )();
      // don't throw the error, it's not essential
      // throw e;
    }
  }

  processPassword() {
    debugLog.info(
      chrome.i18n.getMessage('debug_processingThePasswordForNzbFile'),
      this.title
    );
    try {
      if (!this.password && isset(() => this.data.nzb[0].head)) {
        for (let value of this.data.nzb[0].head) {
          if (
            isset(() => value.meta[0].attr.type) &&
            value.meta[0].attr.type === 'password' &&
            isset(() => value.meta[0]['#text'])
          ) {
            this.password = value.meta[0]['#text'];
          }
        }
      }
    } catch (e) {
      debugLog.error(
        chrome.i18n.getMessage('error_whileProcessingThePasswordForNzbFile', [
          this.title,
          e.message,
        ])
      )();
      // don't throw the error, it's not essential
      // throw e;
    }
  }

  addMetaData() {
    let meta = [];
    if (
      this.settings.processing.addTitle ||
      this.settings.processing.addPassword ||
      this.settings.processing.addCategory
    ) {
      debugLog.info(chrome.i18n.getMessage('debug_addingMetaDataToNzbFile'));
      try {
        if (this.title && this.settings.processing.addTitle) {
          debugLog.info(chrome.i18n.getMessage('debug_addingTitleToMetaData'));
          meta.push({
            attr: { type: 'title' },
            '#text': this.title,
          });
        }
        if (this.password && this.settings.processing.addPassword) {
          debugLog.info(
            chrome.i18n.getMessage('debug_addingPasswordToMetaData')
          );
          meta.push({
            attr: { type: 'password' },
            '#text': this.password,
          });
        }
        if (this.category && this.settings.processing.addCategory) {
          debugLog.info(
            chrome.i18n.getMessage('debug_addingCategoryToTheMetaData')
          );
          meta.push({
            attr: { type: 'category' },
            '#text': this.category,
          });
        }
      } catch (e) {
        debugLog.error(
          chrome.i18n.getMessage('debug_errorWhileAddingTheMetaData')
        )();
        // don't throw the error, it's not essential
      }
    }
    return meta;
  }

  generateXML() {
    try {
      debugLog.info(
        chrome.i18n.getMessage('debug_generatingFinalNzbFile', this.title)
      );
      let options = {
        attrNodeName: 'attr', //default is 'false'
        attributeNamePrefix: '',
        ignoreAttributes: false,
        format: true,
        indentBy: '  ',
      };
      let j2xParser = new parser.j2xParser(options);
      let nzb = {
        nzb: [
          {
            attr: { xmlns: 'http://www.newzbin.com/DTD/2003/nzb' },
            head: { meta: this.addMetaData() },
            file: this.data.nzb[0].file,
          },
        ],
      };
      this.file = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN" "http://www.newzbin.com/DTD/nzb/nzb-1.1.dtd">
<!-- Downloaded from ${this.source} with NZBDonkey v${version} -->
${j2xParser.parse(nzb)}`;
    } catch (e) {
      debugLog.error(
        chrome.i18n.getMessage('error_whileGeneratingFinalNzbFile', [
          this.title,
          e.message,
        ])
      )();
      throw e;
    }
  }

  async pushToTarget() {
    debugLog.info(
      chrome.i18n.getMessage('info_pushingNzbFileToTarget', [
        this.title,
        this.settings.target.targets[this.target].name,
      ])
    );
    await new targets[this.settings.target.targets[this.target].type].target(
      this
    ).push();
  }

  info(message) {
    debugLog.info(message)();
    notification.info(message, this.id);
  }

  success(
    message = chrome.i18n.getMessage('info_nzbFileSuccesfullyPushedToTarget', [
      this.title,
      this.settings.target.targets[this.target].name,
    ])
  ) {
    nzbLog.log(this, 'success');
    debugLog.info(message)();
    notification.success(message, this.id);
  }

  error(e, message = false) {
    nzbLog.log(this, 'error', message ? message : e.message);
    let text = message
      ? message
      : this.title
      ? chrome.i18n.getMessage('error_whileProcessingTitle', this.title)
      : chrome.i18n.getMessage('error_whileProcessing');
    message += e.message !== '' ? ': ' + e.message : '';
    debugLog.error(text)();
    if (e && window.NZBDONKEY_DEVELOPMENT) console.log(e);
    notification.error(text, this.id);
  }
}

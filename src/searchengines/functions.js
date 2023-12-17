import jsonpath from 'jsonpath';
import { myFetch, isset, nzb2xml } from '../functions/functions.js';
import debugLog from '../logger/debugLog.js';

export default {
  getNZB: async function (header, engine) {
    let response = await this.search(header, engine);
    let nzbID = this.checkresponse(response, engine);
    let downloadOptions = this.setOptions(nzbID, engine);
    return await this.download(downloadOptions, engine);
  },

  search: async function (header, engine) {
    debugLog.info(
      `Searching search engine "${engine.name}" for header: ${header}`
    )();
    if (engine.removeUnderscore) {
      header = header.replace('_', ' ');
    }
    if (engine.removeHyphen) {
      header = header.replace('-', ' ');
    }
    if (engine.setIntoQuotes) {
      header = `"${header}"`;
    }
    const nzbSearchURL = engine.searchURL.replace(/%s/, encodeURI(header));
    debugLog.info(
      `Search URL for search engine "${engine.name}" is set to: ${nzbSearchURL}`
    )();
    const options = {
      url: nzbSearchURL,
      responseType: 'text',
      timeout: 10000,
    };
    try {
      const response = await myFetch(options);
      debugLog.info(`Search engine "${engine.name}" has sent a response`)();
      return response;
    } catch (e) {
      let error = e.message ? e.message : `Unknown Error!`;
      debugLog.warn(
        `Error while searching on search engine "${engine.name}": ${error}`
      )();
      throw new Error(error);
    }
  },

  checkresponse: function (response, engine) {
    try {
      debugLog.info(
        `Checking the response from search engine "${engine.name}" for the NZB file ID`
      )();
      if (engine.responseType === 'html') {
        try {
          const re = new RegExp(engine.searchPattern, 'i');
          if (re.test(response)) {
            const nzbID = response.match(re)[engine.searchGroup];
            debugLog.info(
              `NZB file ID found in the response from search engine "${engine.name}"`
            )();
            return nzbID;
          }
        } catch (e) {
          throw new Error(
            `No valid search pattern for search engine "${engine.name}"!`
          );
        }
        throw new Error(
          `No NZB file ID found in the html response from search engine "${engine.name}"!`
        );
      } else if (engine.responseType === 'json') {
        let response_JSON;
        try {
          response_JSON = JSON.parse(response);
        } catch (e) {
          throw new Error(
            `Search engine "${engine.name}" did not return a valid JSON response!`
          );
        }
        let nzbID;
        try {
          nzbID = jsonpath.nodes(response_JSON, `$.${engine.searchPattern}`);
        } catch (e) {
          throw new Error(
            `No valid JSON object path for search engine "${engine.name}"!`
          );
        }
        if (isset(() => nzbID[0].value)) {
          debugLog.info(
            `NZB file ID found in the response from search engine "${engine.name}"`
          )();
          return nzbID[0].value;
        } else {
          throw new Error(
            `No NZB file ID found in the JSON response from search engine "${engine.name}"!`
          );
        }
      } else {
        throw new Error(
          `No valid searchType for search engine "${engine.name}"!`
        );
      }
    } catch (e) {
      debugLog.warn(
        `Error while checking the response from search engine "${engine.name}" for the NZB file ID: ${e.message}`
      )();
      throw e;
    }
  },

  setOptions: function (nzbID, engine) {
    const nzbDownloadURL = engine.downloadURL.replace(/%s/, nzbID);
    debugLog.info(
      `The download URL for NZB file with ID ${nzbID} from search engine "${engine.name}" is set to ${nzbDownloadURL}`
    )();
    return {
      url: nzbDownloadURL,
      responseType: 'text',
      timeout: 180000,
    };
  },

  download: async function (options, engine) {
    let response;
    try {
      response = await myFetch(options);
    } catch (e) {
      let error = e.message ? e.message : `Unknown Error!`;
      debugLog.warn(
        `Error while trying to download the NZB file from search engine "${engine.name}": ${error.message}`
      )();
      throw new Error(error);
    }
    try {
      let data = nzb2xml(response);
      debugLog.info(
        `The response from search engine "${engine.name}" is a valid NZB file`
      )();
      return data;
    } catch (e) {
      throw new Error(
        `The response from search engine "${engine.name}" was not a valid NZB file!`
      );
    }
  },
};

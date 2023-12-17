/* taken from https://www.npmjs.com/package/jdownloader-api */
/* under the ISC license and modified for NZBDonkey         */

const crypto = require('ezcrypto').Crypto;
const aesjs = require('aes-js');
const functions = require('../../functions/functions.js');
const textEncoding = require('text-encoding');
const pkcs7 = require('pkcs7');

const __ENPOINT = 'https://api.jdownloader.org';
const __APPKEY = 'nzbdonkey_webextension';
const __SERVER_DOMAIN = 'server';
const __DEVICE_DOMAIN = 'device';

let __rid_counter;
let __loginSecret;
let __deviceSecret;
let __sessionToken;
let __regainToken;
let __serverEncryptionToken;
let __deviceEncryptionToken;
const __apiVer = 1;

const uniqueRid = () => {
  __rid_counter = Math.floor(Date.now());
  return __rid_counter;
};

const createSecret = (username, password, domain) =>
  crypto.SHA256(username + password + domain, { asBytes: true });

const sign = (key, data) =>
  crypto.HMAC(crypto.SHA256, data, key, { asBytes: false });

const encrypt = (data, iv_key) => {
  const string_iv_key = crypto.charenc.Binary.bytesToString(iv_key);
  const string_iv = string_iv_key.substring(0, string_iv_key.length / 2);
  const string_key = string_iv_key.substring(
    string_iv_key.length / 2,
    string_iv_key.length
  );
  const iv = crypto.charenc.Binary.stringToBytes(string_iv);
  const key = crypto.charenc.Binary.stringToBytes(string_key);
  const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
  const dataBytes = aesjs.utils.utf8.toBytes(data);
  const paddedData = aesjs.padding.pkcs7.pad(dataBytes);
  const encryptedBytes = aesCbc.encrypt(paddedData);
  const buff = Buffer.from(encryptedBytes, 'base64');
  const base64data = buff.toString('base64');
  return base64data;
};

const decrypt = (data, iv_key) => {
  const string_iv_key = crypto.charenc.Binary.bytesToString(iv_key);
  const string_iv = string_iv_key.substring(0, string_iv_key.length / 2);
  const string_key = string_iv_key.substring(
    string_iv_key.length / 2,
    string_iv_key.length
  );
  const iv = crypto.charenc.Binary.stringToBytes(string_iv);
  const key = crypto.charenc.Binary.stringToBytes(string_key);
  const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
  const test = aesCbc.decrypt(Buffer.from(data, 'base64'));
  const textDecoder = new textEncoding.TextDecoder('utf-8');
  return textDecoder.decode(pkcs7.unpad(test));
};

const unescapeJson = (json) =>
  json
    .replace(
      /[^\x30-\x39\x41-\x5A\x61-\x7A\x7B\x7D\x20\x26\x28\x29\x2C\x27\x22\x2E\x2F\x26\x40\x5C\x3A\x2D\x5C\x5B\x5D]/g,
      ''
    )
    .replace(/\s+/g, ' ');

const postQuery = async (url, params = false) => {
  let init = {
    method: params ? 'POST' : 'GET',
    headers: new Headers({
      'Content-Type': 'application/aesjson-jd; charset=utf-8',
    }),
    url: url,
    credentials: 'omit',
  };
  if (params) {
    init.body = params;
  }

  // fetch function with timeout
  const fetchTimeout = (url, fetchOptions = {}) => {
    const controller = new AbortController();
    const promise = fetch(url, { signal: controller.signal, ...fetchOptions });
    const timeout = setTimeout(() => controller.abort(), 120000);
    return promise.finally(() => clearTimeout(timeout));
  };

  let response;
  try {
    response = await fetchTimeout(url, init);
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('The request timed out!');
    } else {
      throw new Error('The request failed due to a network error!');
    }
  }
  if (response.ok) {
    return response.text();
  } else {
    let errorMsg = 'Error code: ' + response.status;
    try {
      let json = await response.json();
      if (json.type) errorMsg += ' - ' + json.type;
    } catch (e) {
      if (response.statusText) {
        errorMsg += ' - ' + response.statusText;
      }
    }
    throw new Error(errorMsg);
  }
};

const callServer = (query, key, params) => {
  let rid = uniqueRid();
  if (params) {
    if (key) {
      params = encrypt(params, key);
    }
    rid = __rid_counter;
  }

  if (query.includes('?')) {
    query += '&';
  } else {
    query += '?';
  }
  query = `${query}rid=${rid}`;
  const signature = sign(key, query);
  query += `&signature=${signature}`;
  const url = __ENPOINT + query;

  return new Promise((resolve, rejected) => {
    postQuery(url, params)
      .then((parsedBody) => {
        const result = decrypt(parsedBody, key);
        resolve(JSON.parse(unescapeJson(result)));
      })
      .catch((err) => {
        rejected(err);
      });
  });
};

const callAction = (action, deviceId, params) => {
  if (__sessionToken === undefined) {
    return Promise.reject(new Error('Not connected'));
  }
  const query = `/t_${encodeURI(__sessionToken)}_${encodeURI(
    deviceId
  )}${action}`;
  let json;
  if (params) {
    json = {
      url: action,
      params,
      rid: uniqueRid(),
      apiVer: __apiVer,
    };
  } else {
    json = {
      url: action,
      rid: uniqueRid(),
      apiVer: __apiVer,
    };
  }
  const jsonData = encrypt(JSON.stringify(json), __deviceEncryptionToken);
  const url = __ENPOINT + query;
  return new Promise((resolve, rejected) => {
    postQuery(url, jsonData)
      .then((parsedBody) => {
        const result = decrypt(parsedBody, __deviceEncryptionToken);
        resolve(JSON.parse(unescapeJson(result)));
      })
      .catch((err) => {
        rejected(err);
      });
  });
};

const updateEncryptionToken = (oldTokenBytes, updateToken) => {
  const updateTokenBytes = crypto.util.hexToBytes(updateToken);
  const buffer = Buffer.from(oldTokenBytes);
  const secondbuffer = Buffer.from(updateTokenBytes);
  const thirdbuffer = Buffer.concat(
    [buffer, secondbuffer],
    buffer.length + secondbuffer.length
  );
  return crypto.SHA256(thirdbuffer, { asBytes: true });
};

exports.connect = (username, password) => {
  __loginSecret = createSecret(username, password, __SERVER_DOMAIN);
  __deviceSecret = createSecret(username, password, __DEVICE_DOMAIN);
  const query = `/my/connect?email=${encodeURI(username)}&appkey=${__APPKEY}`;

  return new Promise((resolve, rejected) => {
    callServer(query, __loginSecret, null)
      .then((val) => {
        __sessionToken = val.sessiontoken;
        __regainToken = val.regaintoken;
        __serverEncryptionToken = updateEncryptionToken(
          __loginSecret,
          __sessionToken
        );
        __deviceEncryptionToken = updateEncryptionToken(
          __deviceSecret,
          __sessionToken
        );
        resolve(true);
      })
      .catch((error) => {
        rejected(error);
      });
  });
};

exports.reconnect = function () {
  const query = `/my/reconnect?appkey=${encodeURI(
    __APPKEY
  )}&sessiontoken=${encodeURI(__sessionToken)}&regaintoken=${encodeURI(
    __regainToken
  )}`;
  return new Promise((resolve, rejected) => {
    callServer(query, __serverEncryptionToken)
      .then((val) => {
        __sessionToken = val.sessiontoken;
        __regainToken = val.regaintoken;
        __serverEncryptionToken = updateEncryptionToken(
          __serverEncryptionToken,
          __sessionToken
        );
        __deviceEncryptionToken = updateEncryptionToken(
          __deviceSecret,
          __sessionToken
        );
        resolve(true);
      })
      .catch((error) => {
        rejected(error);
      });
  });
};

exports.disconnect = function () {
  const query = `/my/disconnect?sessiontoken=${encodeURI(__sessionToken)}`;
  return new Promise((resolve, rejected) => {
    callServer(query, __serverEncryptionToken)
      .then(() => {
        __sessionToken = '';
        __regainToken = '';
        __serverEncryptionToken = '';
        __deviceEncryptionToken = '';
        resolve(true);
      })
      .catch((error) => {
        rejected(error);
      });
  });
};

exports.listDevices = () => {
  const query = `/my/listdevices?sessiontoken=${encodeURI(__sessionToken)}`;
  return new Promise((resolve, rejected) => {
    callServer(query, __serverEncryptionToken)
      .then((val) => {
        resolve(val.list);
      })
      .catch((error) => {
        rejected(error);
      });
  });
};

exports.getDirectConnectionInfos = (deviceId) =>
  new Promise((resolve, rejected) => {
    callAction('/device/getDirectConnectionInfos', deviceId, null)
      .then((val) => {
        resolve(val);
      })
      .catch((error) => {
        rejected(error);
      });
  });

exports.addLinks = (links, deviceId, autostart = true) => {
  const params = `{"priority":"DEFAULT","links":"${links}","autostart":${autostart}}`;
  return new Promise((resolve, rejected) => {
    callAction('/linkgrabberv2/addLinks', deviceId, [params])
      .then((val) => {
        resolve(val);
      })
      .catch((error) => {
        rejected(error);
      });
  });
};

exports.addLinksRaw = (parameters, deviceId) => {
  const params = JSON.stringify(parameters);
  return new Promise((resolve, rejected) => {
    callAction('/linkgrabberv2/addLinks', deviceId, [params])
      .then((val) => {
        resolve(val);
      })
      .catch((error) => {
        rejected(error);
      });
  });
};

exports.queryLinks = (deviceId) => {
  const params = `{"addedDate" : true,
                   "bytesLoaded": true,
                   "bytesTotal": true,
                   "enabled": true,
                   "finished": true,
                   "url": true,
                   "status": true,
                   "speed": true,
                   "finishedDate": true,
                   "priority" : true,
                   "extractionStatus": true,
                   "host": true,
                   "running" : true}`;
  return new Promise((resolve, rejected) => {
    callAction('/downloadsV2/queryLinks', deviceId, [params])
      .then((val) => {
        resolve(val);
      })
      .catch((error) => {
        rejected(error);
      });
  });
};

exports.queryPackages = (deviceId, packagesIds) => {
  const params = `{"addedDate" : true,
  "bytesLoaded": true,
  "bytesTotal": true,
  "enabled": true,
  "finished": true,
  "url": true,
  "status": true,
  "speed": true,
  "finishedDate": true,
  "priority" : true,
  "extractionStatus": true,
  "host": true,
  "running" : true,
  "packageUUIDs" : [${packagesIds}]}`;
  return new Promise((resolve, rejected) => {
    callAction('/downloadsV2/queryPackages', deviceId, [params])
      .then((val) => {
        resolve(val);
      })
      .catch((error) => {
        rejected(error);
      });
  });
};

exports.cleanUpFinishedLinks = (deviceId) => {
  const params = ['[]', '[]', 'DELETE_FINISHED', 'REMOVE_LINKS_ONLY', 'ALL'];
  return new Promise((resolve, rejected) => {
    callAction('/downloadsV2/cleanup', deviceId, params)
      .then((val) => {
        resolve(val);
      })
      .catch((error) => {
        rejected(error);
      });
  });
};

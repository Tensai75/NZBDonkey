import xmlParser from 'fast-xml-parser';

/**
 * myFetch
 *
 * Creats a fetch request with timeout option.
 *
 * Async function which creates an fetch request and returns
 * a promise resolving to the result of the fetch request
 *
 * @param {object|string}   options                 Either the options for the fetch request or directly the url.
 * @param {string}          [options.url]           Url for the fetch request.
 * @param {string}          [options.scheme]        Scheme for constructiong the url for the fetch request.
 * @param {string}          [options.username]      Username for constructiong the url for the fetch request.
 * @param {string}          [options.password]      Password for constructiong the url for the fetch request.
 * @param {string}          [options.host]          Host for constructiong the url for the fetch request.
 * @param {string}          [options.port]          Port for constructiong the url for the fetch request.
 * @param {string}          [options.basepath]      Basepath for constructiong the url for the fetch request.
 * @param {string}          [options.path]          Path for constructiong the url for the fetch request.
 * @param {object}          [options.parameters]    Object with key/value pairs for the GET parameters for constructiong the url for the fetch request.
 * @param {object}          [options.headers]       Additional headers for the fetch request
 * @param {object}          [options.init]          Additional options for the fetch request
 * @param {*}               [options.data]          Data to be sent as POST fetch request. Usually a FormData object.
 * @param {!number}         [options.timeout=10000] Timeout value for the fetch request.
 *
 * @return {promise} Returns a promise resolving to the result of the fetch request.
 */
async function myFetch(options) {
  // construct the url
  const url = createURL(options);

  // construct the headers
  let headers = new Headers({ 'X-NZBDonkey': true, ...options.headers });
  if (options.username) {
    headers.append(
      'Authorization',
      'Basic ' + b64EncodeUnicode(options.username + ':' + options.password)
    );
  }

  let init = {
    method: options.data ? 'POST' : 'GET',
    headers: headers,
    credentials: 'omit',
    ...options.init,
  };
  if (options.data) {
    init.body = options.data;
  }

  // fetch function with timeout
  const fetchTimeout = (url, fetchOptions = {}) => {
    const controller = new AbortController();
    const promise = fetch(url, { signal: controller.signal, ...fetchOptions });
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeout ? options.timeout : 120000
    );
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
    if (options.type === 'blob') return response.blob();
    return response.text();
  } else {
    let errorMsg = 'Error code: ' + response.status;
    if (response.statusText) {
      errorMsg += ' - ' + response.statusText;
    }
    throw new Error(errorMsg);
  }
}

/**
 * createURL
 *
 * Creats an url.
 *
 * Function which creates an url.
 *
 * @param {object|string}   options                 Either the options for the url or directly the url.
 * @param {string}          [options.url]           The url.
 * @param {string}          [options.scheme]        Scheme for the url.
 * @param {string}          [options.host]          Host for the url.
 * @param {string}          [options.port]          Port for the url.
 * @param {string}          [options.basepath]      Basepath the url.
 * @param {string}          [options.path]          Path for the url.
 * @param {object}          [options.parameters]    Object with key/value pairs for the GET parameters for the url.
 *
 * @return {string} Returns the url as an uri encoded string.
 */
function createURL(options) {
  let url;
  if (typeof options === 'string') {
    try {
      url = new URL(options);
    } catch (e) {
      throw new Error('no valid URL');
    }
  } else if (options.url && typeof options.url === 'string') {
    try {
      url = new URL(options.url);
    } catch (e) {
      throw new Error('no valid URL');
    }
  } else {
    url = new URL('http://localhost');
  }
  if (options.host && typeof options.host === 'string') {
    url.hostname = options.host.match(/^(?:.*?:\/\/)?([^/:]+)/i)[1];
  }
  if (options.port && Number.isInteger(Number.parseInt(options.port, 10))) {
    url.port = Number.parseInt(options.port, 10);
  }
  if (options.basepath && typeof options.basepath === 'string') {
    url.pathname = options.basepath.replace(/^\/+|\/+$/g, '');
  }
  if (options.path && typeof options.path === 'string') {
    if (url.pathname !== '/') {
      url.pathname += '/';
    }
    url.pathname += options.path.replace(/^\/+|\/+$/g, '');
  }
  if (options.parameters) {
    const queryString = Object.keys(options.parameters)
      .map((key) => {
        if (Array.isArray(options.parameters[key])) {
          return Object.keys(options.parameters[key])
            .map((key2) => `${key}=${options.parameters[key][key2]}`)
            .join('&');
        } else {
          return `${key}=${options.parameters[key]}`;
        }
      })
      .join('&');
    url.search += url.search === '' ? `?${queryString}` : `&${queryString}`;
  }
  if (options.scheme && typeof options.scheme === 'string') {
    url.protocol = options.scheme.match(/[a-z\d-]+/i)[0].toLowerCase();
  }
  return url.href;
}

// function to generate the form Data
function generateFormData(data) {
  const formData = new FormData();
  if (typeof data === 'object') {
    for (let key in data) {
      if (Array.isArray(data[key])) {
        if (/.*\[\]$/.test(key)) {
          for (let i = 0; i < data[key].length; i += 1) {
            formData.append(key, data[key][i].toString());
          }
        } else {
          if (data[key].length === 1) {
            formData.append(key, data[key][0]);
          } else if (data[key].length === 2) {
            formData.append(key, data[key][0], data[key][1]);
          }
        }
      } else {
        formData.append(key, data[key]);
      }
    }
  }
  return formData;
}

// function to analyze an URL
function analyzeURL(u) {
  const url = {};
  const mapping = [
    { href: false },
    { scheme: true },
    { username: true },
    { password: true },
    { domain: true },
    { port: true },
    { fullpath: true },
    { path: true },
    { filename: true },
    { query: false },
    { hashtag: true },
  ];
  u.match(
    /(?:([^:]*):(?:\/){0,2})?(?:([^:@]*)(?::([^@]*))?@)?((?:(?:[^/:?]*)\.(?=[^./:?]*\.[^./:?]*))?(?:[^./:?]*)(?:\.(?:[^/.:]*))?)(?::([0-9]*))?(([/]?[^?#]*(?=.*?\/)\/)?([^/?#]*)?)(?:\?([^#]*))?(?:#(.*))?/
  ).map((value, index) => {
    if (value) {
      const [[name, decode]] = Object.entries(mapping[index]);
      url[name] = decode
        ? decodeURIComponent(value.replace(/\+/g, '%20'))
        : value;
    }
  });
  if (url.domain && url.domain.match(/(?:[^.]*\.)?[^.]*$/)) {
    url.basedomain = url.domain.match(/(?:[^.]*\.)?[^.]*$/)[0];
  }
  if (url.query) {
    url.parameters = {};
    url.query.split('&').map((value) => {
      url.parameters[
        decodeURIComponent(value.split('=')[0].replace(/\+/g, '%20'))
      ] = value.split('=')[1]
        ? decodeURIComponent(value.split('=')[1].replace(/\+/g, '%20'))
        : null;
    });
    url.search = `?${url.query}`;
  }
  // add URL object compatible types
  // host & hostname
  if (url.domain) {
    url.host = url.domain;
    url.hostname = url.domain;
    if (url.port) {
      url.host += `:${url.port}`;
    }
  }
  // protocol
  if (url.scheme) {
    url.protocol = `${url.scheme}:`;
  }
  // hash
  if (url.hashtag) {
    url.hash = `#${url.hashtag}`;
  }
  // searchParams
  url.searchParams = new URLSearchParams(url.search);
  // pathname
  if (url.fullpath) {
    url.pathname = url.fullpath;
  }
  return url;
}

// Replace the plus sign which encode spaces in GET parameters.
function decodeUrlParameter(str) {
  return decodeURIComponent(str.toString().replace(/\+/g, '%20'));
}

// function for correct btoa encoding for utf8 strings
// from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64EncodeUnicode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

// function to escape xml special characters
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// error proof function to check if nested objects are set without throwing an error if parent object is undefined
// from https://stackoverflow.com/questions/2281633/javascript-isset-equivalent/2281671
// call it: isset(() => variable.to.be.checked)
/**
 * Checks to see if a value is set.
 *
 * @param {Function} accessor Function that returns our value
 */
function isset(accessor) {
  try {
    // Note we're seeing if the returned value of our function is not
    // undefined
    return typeof accessor() !== 'undefined';
  } catch (e) {
    // And we're able to catch the Error it would normally throw for
    // referencing a property of undefined
    return false;
  }
}

function logDateFormat(date) {
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  return (
    date.getFullYear() +
    '.' +
    pad(date.getMonth() + 1) +
    '.' +
    pad(date.getDate()) +
    ' ' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds()) +
    '.' +
    (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5)
  );
}

function JSONparse(string) {
  try {
    return JSON.parse(string);
  } catch (error) {
    throw new Error('No valid JSON response');
  }
}

function nzb2xml(file) {
  let xml;
  try {
    xml = xmlParser.parse(file, {
      attrNodeName: 'attr', //default is 'false'
      attributeNamePrefix: '',
      ignoreAttributes: false,
      allowBooleanAttributes: true,
      parseAttributeValue: false,
      arrayMode: true,
    });
  } catch (e) {
    throw new Error(`Not a valid XML file!`);
  }
  if (xml.nzb) {
    return xml;
  } else {
    throw new Error(`Not a valid NZB file!`);
  }
}

export {
  myFetch,
  myFetch as xhr,
  createURL,
  generateFormData,
  analyzeURL,
  analyzeURL as analyseURL,
  decodeUrlParameter,
  b64EncodeUnicode,
  escapeXML,
  isset,
  logDateFormat,
  JSONparse,
  nzb2xml,
};
export default {
  myFetch,
  createURL,
  generateFormData,
  analyzeURL,
  decodeUrlParameter,
  b64EncodeUnicode,
  escapeXML,
  isset,
  logDateFormat,
  JSONparse,
  nzb2xml,
};

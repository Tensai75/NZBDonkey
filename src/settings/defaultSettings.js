import { version } from '../../package.json';

export default {
  version: version,
  target: {
    allowMultipleTargets: false,
    showTargetsInContextMenu: false,
    defaultTarget: 0,
    targets: [
      {
        type: 'download',
        active: true,
        name: 'Download',
        settings: {
          defaultPath: 'nzbfiles',
          saveAs: false,
          useCategories: true,
          categories: {
            type: 'automatic',
            fallbackType: 'none',
            fixedCategory: '',
            categories: [
              {
                name: 'TV',
                type: 'tv',
                regex: '((staffel|season|folge|episode).{0,3}\\d|[e|s]\\d+)',
                isTargetCategory: false,
              },
              {
                name: 'Movie',
                type: 'movie',
                regex:
                  '([hx].?26[45]|xvid|hevc|(dvd|bd)rip|bluray|(720|1080|2160)p|uhd|hdr)',
                isTargetCategory: false,
              },
            ],
          },
        },
      },
    ],
  },
  general: {
    catchLinks: true,
    catchLinksShowDialog: false,
    debug: true,
    notifications: 0,
    nzbLog: true,
  },
  interception: {
    enabled: true,
    showDialog: false,
    domains: [
      {
        active: true,
        domain: 'nzbindex.com',
        handling: 'sendFormDataAsGET',
        packedFiles: false,
        useSubject: true,
        isDefault: true,
      },
      {
        active: true,
        domain: 'nzbindex.nl',
        handling: 'sendFormDataAsGET',
        packedFiles: false,
        useSubject: true,
        isDefault: true,
      },
      {
        active: true,
        domain: 'binsearch.info',
        handling: 'sendFormDataAsString',
        packedFiles: false,
        useSubject: true,
        isDefault: true,
      },
      {
        active: true,
        domain: 'nzbking.com',
        handling: 'sendFormDataAsPOST',
        packedFiles: false,
        useSubject: true,
        isDefault: true,
      },
    ],
  },
  completeness: {
    fileCheck: true,
    fileCheckThreshold: 1,
    segmentCheck: true,
    segmentCheckThreshold: 1,
  },
  processing: {
    addCategory: true,
    addPassword: true,
    addTitle: true,
    processTitle: true,
    processTitleType: 'spaces',
  },
  searchengines: {
    searchOrder: 'parallel',
    engines: [
      {
        active: true,
        downloadURL: 'https://nzbindex.com/download/%s/',
        name: 'NZBIndex',
        responseType: 'json',
        searchGroup: '',
        searchPattern: 'results[0].id',
        searchURL:
          'https://nzbindex.com/search/json?sort=agedesc&hidespam=1&q=%s',
        removeUnderscore: false,
        removeHyphen: false,
        setIntoQuotes: false,
        isDefault: true,
      },
      {
        active: true,
        downloadURL: 'http://nzbking.com/nzb:%s/',
        name: 'NZBKing',
        responseType: 'html',
        searchGroup: 1,
        searchPattern: 'href="\\/details:(.*?)\\/"',
        searchURL: 'http://nzbking.com/search/?q=%s',
        removeUnderscore: false,
        removeHyphen: false,
        setIntoQuotes: false,
        isDefault: true,
      },
      {
        active: true,
        downloadURL: 'https://binsearch.info/?action=nzb&%s=1',
        name: 'BinSearch',
        responseType: 'html',
        searchGroup: 1,
        searchPattern: 'name="(\\d{9,})"',
        searchURL: 'https://binsearch.info/?max=100&adv_age=1100&q=%s',
        removeUnderscore: false,
        removeHyphen: false,
        setIntoQuotes: false,
        isDefault: true,
      },
      {
        active: true,
        downloadURL: 'https://binsearch.info/?action=nzb&%s=1&server=2',
        name: 'BinSearch (other groups)',
        responseType: 'html',
        searchGroup: 1,
        searchPattern: 'name="(\\d{9,})"',
        searchURL: 'https://binsearch.info/?max=100&adv_age=1100&server=2&q=%s',
        removeUnderscore: false,
        removeHyphen: false,
        setIntoQuotes: false,
        isDefault: true,
      },
    ],
  },
};
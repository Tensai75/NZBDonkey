export default [
  {
    name: 'engineSettings',
    title: '',
    settings: [
      {
        name: 'name',
        title: 'Search Engine Name',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'text',
        options: [],
        rules: {},
      },
      {
        name: 'searchURL',
        title: 'Search URL',
        subtitle: '',
        caption: '',
        description: '',
        helptext:
          '<div style="max-width:250px;">URL called for a NZB file search. Use "%s" for the search string.</div>',
        inputType: 'text',
        options: [],
        rules: {
          required: true,
          url: true,
          urlID: true,
        },
      },
      {
        name: 'setIntoQuotes',
        title: '',
        subtitle: '',
        caption: 'Suchstring in Anführungszeichen setzen',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
      },
      {
        name: 'removeUnderscore',
        title: '',
        subtitle: '',
        caption: 'Unterstriche entfernen',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        class: ['row', 'cell-12', 'mt-4-minus'],
      },
      {
        name: 'removeHyphen',
        title: '',
        subtitle: '',
        caption: 'Bindestriche (Minus) entfernen',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        class: ['row', 'cell-12', 'mt-4-minus'],
      },
      {
        name: 'responseType',
        title: 'Response Type',
        subtitle: '',
        caption: '',
        description: '',
        helptext:
          '<div style="max-width:250px;">Type of response sent back from the search engine. Can be either a HTML page or a JSON object.</div>',
        inputType: 'select',
        options: [
          {
            value: 'html',
            text: 'HTML page',
            helptext: '',
          },
          {
            value: 'json',
            text: 'JSON Object',
            helptext: '',
          },
        ],
        rules: {},
      },
      {
        name: 'searchPattern',
        title: 'JSON object path',
        subtitle: '',
        caption: '',
        description: '',
        helptext:
          '<div style="max-width:250px;">JSON object path for the NZB file ID (divided by periods). Example: { results: [ { nzbid: 123456 }, ... ], ... } => "results[0].nzbid"</div>',
        inputType: 'text',
        options: [],
        rules: {
          required: true,
        },
        disabledOn: [
          {
            parameter: 'responseType',
            value: 'html',
          },
        ],
      },
      {
        name: 'searchPattern',
        title: 'Regex expression',
        subtitle: '',
        caption: '',
        description: '',
        helptext:
          '<div style="max-width:250px;">Regex expression to be used to search in the HTML search results page for the NZB file ID. The NZB file ID has to be in a capturing group ().</div>',
        inputType: 'text',
        options: [],
        rules: {
          required: true,
          regex: true,
        },
        disabledOn: [
          {
            parameter: 'responseType',
            value: 'json',
          },
        ],
      },
      {
        name: 'searchGroup',
        title: 'Group no.',
        subtitle: '',
        caption: '',
        description: '',
        helptext:
          '<div style="max-width:250px;">Number of the capturing group in the regex expression that does contain the NZB file ID.</div>',
        inputType: 'number',
        options: [],
        rules: {
          required: true,
          number: true,
        },
        disabledOn: [
          {
            parameter: 'responseType',
            value: 'json',
          },
        ],
      },
      {
        name: 'downloadURL',
        title: 'Download URL',
        subtitle: '',
        caption: '',
        description: '',
        helptext:
          '<div style="max-width:250px;">URL called to download the NZB file. Use "%s" for the NZB file ID.</div>',
        inputType: 'text',
        options: [],
        rules: {
          required: true,
          url: true,
          urlID: true,
        },
      },
    ],
    hasEngineTest: true,
    nextButton: 'Test',
  },
];

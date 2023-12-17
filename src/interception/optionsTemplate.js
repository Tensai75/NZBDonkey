export default [
  {
    name: 'domainSettings',
    title: '',
    settings: [
      {
        name: 'domain',
        title: 'Domain',
        subtitle: 'Base domain only!',
        caption: '',
        description:
          'Base domain where you want to intercept NZB file download. CAUTION: do not add "www" or any other subdomains.',
        helptext: '',
        inputType: 'text',
        options: [],
        rules: {
          required: true,
          baseDomain: true,
        },
      },
      {
        name: 'handling',
        title: 'Handling of Form Data',
        subtitle: '',
        caption: '',
        description: `Determins how POST Form Data should be handled for this domain.
        If the default value is resulting in constant error messages regarding
        invalid or empty NZB files, try one of the other options.`,
        helptext: '',
        inputType: 'select',
        options: [
          {
            value: 'sendFormDataAsPOST',
            text: 'Form Data as POST request (default)',
            helptext: '',
          },
          {
            value: 'sendFormDataAsGET',
            text: 'Send Form Data as GET request',
            helptext: '',
          },
          {
            value: 'sendFormDataAsString',
            text: 'Send Form Data as String',
            helptext: '',
          },
        ],
        rules: {},
        class: ['row', 'mt-6'],
      },
      {
        name: 'packedFiles',
        title: 'Packed files',
        subtitle: '',
        caption: 'intercept the download of packed files',
        description:
          'If activated NZBDonkey will intercept the download of packed files (i.e. .rar and .zip) and if they contain NZB files, it will extract and process them.',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        class: ['row', 'mt-6'],
      },
      {
        name: 'useSubject',
        title: 'File name',
        subtitle: '',
        caption: 'Use subject as file name / title',
        description: `If activated NZBDonkey will use the subject of the first file within the NZB file as title/file name for the intercepted NZB file.
        Can be benefitial if the the intercepted NZB file download has an obscure file name (e.g. a hash value).`,
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        class: ['row', 'mt-6'],
      },
    ],
    nextButton: 'Save',
  },
];

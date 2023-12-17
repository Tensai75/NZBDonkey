export default [
  {
    name: 'connectionSettings',
    title: 'Connection Settings',
    settings: [
      {
        name: 'username',
        title: 'premiumize.me Customer ID',
        subtitle: 'can be found on your premiumize.me account page',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'text',
        rules: {},
        isAdvancedSetting: false,
      },
      {
        name: 'password',
        title: 'premiumize.me PIN',
        subtitle: 'can be found on your premiumize.me account page',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'text',
        rules: {},
        isAdvancedSetting: false,
      },
    ],
    hasConnectionTest: true,
    isCategorySetting: false,
    nextButton: 'Test Connection',
  },
];

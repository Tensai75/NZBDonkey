export default [
  {
    name: 'connectionSettings',
    title: chrome.i18n.getMessage(
      'target_jdownloader_connectionSettings_title'
    ),
    settings: [
      {
        name: 'username',
        title: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_username_title'
        ),
        subtitle: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_username_subtitle'
        ),
        caption: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_username_caption'
        ),
        description: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_username_description'
        ),
        helptext: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_username_helptext'
        ),
        inputType: 'text',
        rules: {},
        isAdvancedSetting: false,
      },
      {
        name: 'password',
        title: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_password_title'
        ),
        subtitle: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_password_subtitle'
        ),
        caption: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_password_caption'
        ),
        description: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_password_description'
        ),
        helptext: chrome.i18n.getMessage(
          'target_jdownloader_connectionSettings_password_helptext'
        ),
        inputType: 'text',
        rules: {},
        isAdvancedSetting: false,
      },
    ],
    hasConnectionTest: true,
    isCategorySetting: false,
    nextButton: chrome.i18n.getMessage('general_testconnection'),
  },
  {
    name: 'additionalSettings',
    title: chrome.i18n.getMessage(
      'target_jdownloader_additionalSettings_title'
    ),
    settings: [
      {
        name: 'addPaused',
        title: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_addPaused_title'
        ),
        subtitle: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_addPaused_subtitle'
        ),
        caption: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_addPaused_caption'
        ),
        description: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_addPaused_description'
        ),
        helptext: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_addPaused_helptext'
        ),
        inputType: 'switch',
        rules: {},
        isAdvancedSetting: false,
      },
      {
        name: 'device',
        title: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_deviceID_title'
        ),
        subtitle: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_deviceID_subtitle'
        ),
        caption: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_deviceID_caption'
        ),
        description: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_deviceID_description'
        ),
        helptext: chrome.i18n.getMessage(
          'target_jdownloader_additionalSettings_deviceID_helptext'
        ),
        inputType: 'jdDeviceID',
        options: [],
        rules: {},
        isAdvancedSetting: false,
      },
    ],
    hasConnectionTest: false,
    isCategorySetting: false,
    nextButton: chrome.i18n.getMessage('general_save'),
  },
];

export default {
  target: {
    name: 'NZB-Ziel Einstellungen',
    settings: [
      {
        name: 'allowMultipleTargets',
        title: 'Ziel-Auswahl Einstellung',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'radio',
        options: [
          {
            value: false,
            text: 'NZB-Datei ans Standard Ziel senden',
            helptext: 'HilfeText',
          },
          {
            value: true,
            text: 'Auswahl für das NZB-Ziel anzeigen',
            helptext: 'Hilfetext 2',
          },
        ],
        rules: {},
        isAdvancedSetting: false,
        isQuickSetting: true,
      },
      {
        name: 'showTargetsInContextMenu',
        title: '',
        subtitle: '',
        caption:
          'Show target selection in context menu and th NZBDonkey dialog',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        dontShowIf: [
          {
            parameter: 'target.allowMultipleTargets',
            value: true,
          },
        ],
      },
      {
        name: 'targets',
        title: 'NZB-Datei Ziele',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'targets',
        options: {
          active: {
            title: 'Aktiv',
            helptext: `<center>NZB-Datei Ziele, die bei der Auswahl<br /> angezeigt werden sollen.</center>`,
          },
          defaultTarget: {
            title: 'Ziel',
            helptext: 'Auswahl des Standard NZB-Datei Ziel',
          },
          type: {
            title: 'Typ',
            helptext: false,
          },
          name: {
            title: 'Name',
            helptext: 'Angezeigter Name des NZB-Datei Ziel',
          },
        },
        rules: {},
        isAdvancedSetting: false,
        isQuickSetting: true,
      },
    ],
  },
  searchengines: {
    name: 'Suchmaschinen',
    settings: [
      {
        name: 'searchOrder',
        title: 'Suchreihenfolge',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'radio',
        options: [
          {
            value: 'parallel',
            text: 'Gleichzeit in allen Suchmaschinen suchen',
            helptext: `Sucht gleichzeit in allen aktiven Suchmaschinen.
              Es wird die NZB-Datei der Suchmaschine verwendet,
              welche am schnellsten ein gültiges Resultat liefert.`,
          },
          {
            value: 'sequential',
            text: 'Suchmaschinen der Reihe nach absuchen',
            helptext: `Sucht der Reihe nach alle aktiven Suchmaschinen ab.
              Es wird die NZB-Datei der ersten Suchmaschine verwendet,
              welche ein gültiges Resultat liefert.
              Die Reihenfolge der Suchmaschinen kann über "Drag&Drop" eingestellt werden.`,
          },
        ],
        rules: {},
        isAdvancedSetting: false,
        isQuickSetting: true,
      },
      {
        name: 'engines',
        title: 'Suchmaschinen',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'engines',
        options: {
          active: {
            title: 'Aktiv',
            helptext: 'Check if you want to use this search engine',
          },
          name: {
            title: 'Search Engine Name',
            helptext: '',
          },
        },
        rules: {},
        isAdvancedSetting: false,
        isQuickSetting: true,
      },
    ],
  },
  interception: {
    name: 'Download Interception',
    settings: [
      {
        name: 'enabled',
        title: 'Intercept NZB downloads',
        subtitle: '',
        caption: 'Intercept NZB file downloads',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        isQuickSetting: true,
      },
      {
        name: 'showDialog',
        title: 'NZBDonkey dialog',
        subtitle: '',
        caption: 'Show NZBDonkey dialog for all intercepted downloads',
        description:
          'If activated, a pop-up window will appear for all intercepted downloads to edit the title, password and category befor sendig it to the target',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        isQuickSetting: true,
        dontShowIf: [
          {
            parameter: 'interception.enabled',
            value: false,
          },
        ],
      },
      {
        name: 'domains',
        title: 'Domains',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'domains',
        options: {
          active: {
            title: 'Aktiv',
            helptext:
              'Check if you want enable download interception on this domain',
          },
          domain: {
            title: 'Domain',
            helptext: '',
          },
        },
        rules: {},
        isAdvancedSetting: false,
        isQuickSetting: true,
        dontShowIf: [
          {
            parameter: 'interception.enabled',
            value: false,
          },
        ],
      },
    ],
  },
  completeness: {
    name: 'NZB-Datei Vollständigkeitsprüfung',
    settings: [
      {
        name: 'fileCheck',
        title: 'Dateien',
        subtitle: '',
        caption: 'Anzahl der Dateien überprüfen',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
      },
      {
        name: 'fileCheckThreshold',
        title: 'Anzahl erlaubter fehlende Dateien',
        subtitle: '',
        caption: '',
        description:
          'NZB-Dateien mit mehr fehlenden Dateien als dieser Wert werden zurückgewiesen.',
        helptext: '',
        inputType: 'slider',
        options: {
          min: 0,
          max: 10,
          hint: '$1',
        },
        rules: {
          required: true,
          percent: true,
        },
        isAdvancedSetting: false,
        dontShowIf: [
          {
            parameter: 'completeness.fileCheck',
            value: false,
          },
        ],
        class: ['cell-12'],
      },
      {
        name: 'segmentCheck',
        title: 'Segmente',
        subtitle: '',
        caption: 'Anzahl der Segmente überprüfen',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        class: ['cell-12', 'mt-6'],
      },
      {
        name: 'segmentCheckThreshold',
        title: 'Anzahl erlaubter fehlende Segmente in %',
        subtitle: '',
        caption: '',
        description:
          'NZB-Dateien mit mehr fehlenden Segmenten als dieser Prozent-Wert werden zurückgewiesen.',
        helptext: '',
        inputType: 'slider',
        options: {
          min: 0,
          max: 10,
          hint: '$1%',
        },
        rules: {
          required: true,
          percent: true,
        },
        isAdvancedSetting: false,
        dontShowIf: [
          {
            parameter: 'completeness.segmentCheck',
            value: false,
          },
        ],
        class: ['cell-12'],
      },
    ],
  },
  processing: {
    name: 'NZB-Datei Bearbeitung',
    settings: [
      {
        name: 'processTitle',
        title: 'NZB-Dateinamen Bearbeitung',
        subtitle: '',
        caption: 'process the NZB file name',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
      },
      {
        name: 'processTitleType',
        title: '',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'select',
        options: [
          {
            value: 'spaces',
            text: 'Convert spaces to periods',
            helptext: 'HilfeText',
          },
          {
            value: 'periods',
            text: 'Convert periods to spaces',
            helptext: 'Hilfetext 2',
          },
        ],
        rules: {},
        isAdvancedSetting: false,
        dontShowIf: [
          {
            parameter: 'processing.processTitle',
            value: false,
          },
        ],
        class: ['cell-12', 'mt-2-minus'],
      },
      {
        name: 'addTitle',
        title: 'NZB-Datei Bearbeitung',
        subtitle: '',
        caption: 'add the title meta tag to the NZB file',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        class: ['cell-12', 'mt-6'],
      },
      {
        name: 'addPassword',
        title: '',
        subtitle: '',
        caption: 'add the password meta tag to the NZB file',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        class: ['cell-12', 'mt-3-minus'],
      },
      {
        name: 'addCategory',
        title: '',
        subtitle: '',
        caption: 'add the category meta tag to the NZB file',
        description: '',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        class: ['cell-12', 'mt-3-minus'],
      },
    ],
  },
  general: {
    name: 'Allgemeine Einstellungen',
    settings: [
      {
        name: 'catchLinks',
        title: 'NZBLNK Links',
        subtitle: '',
        caption: 'Catch left mous clicks on NZBLNK links',
        description:
          'If activated, NZBDonkey will catch and handle left mouse clicks on a NZBLNK link.',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        isQuickSetting: true,
      },
      {
        name: 'catchLinksShowDialog',
        title: 'Show NZBDonkey dialog',
        subtitle: '',
        caption:
          'Shows the NZBDonkey dialog upon left mous clicks on NZBLNK links',
        description:
          'If activated, NZBDonkey will show a dialog when a left mouse clicks on a NZBLNK link was detected.',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        isQuickSetting: true,
      },
      {
        name: 'notifications',
        title: 'Notifications',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'radio',
        options: [
          {
            value: 0,
            text: 'show all notifications',
            helptext: '',
          },
          {
            value: 1,
            text: 'only show success and error notifications',
            helptext: '',
          },
          {
            value: 3,
            text: 'only show error notifications',
            helptext: '',
          },
        ],
        rules: {},
        isAdvancedSetting: false,
        class: ['cell-12', 'mt-6'],
      },
      /*{
        name: 'storage',
        title: 'Synchronisierung der Einstellungen',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'radio',
        options: [
          {
            value: 'sync',
            text: 'Einstellungen mit dem Browser-Konto synchronisieren',
            helptext: '',
          },
          {
            value: 'local',
            text: 'Einstellungen nur für diesen Browser speichern',
            helptext: '',
          },
        ],
        rules: {},
        isAdvancedSetting: false,
        class: ['cell-12', 'mt-6'],
      },*/
      {
        name: 'nzbLog',
        title: 'NZB Log',
        subtitle: '',
        caption: 'Activate NZB Log',
        description:
          'If activated, NZBDonkey will log information about all succesfull or failed NZB downloads/interceptions.',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        class: ['cell-12', 'mt-6'],
      },
      {
        name: 'debug',
        title: 'Debug Mode',
        subtitle: '',
        caption: 'Activate debug mode',
        description:
          'If activated, NZBDonkey will log additional information in the Debug Log.',
        helptext: '',
        inputType: 'switch',
        options: [],
        rules: {},
        isAdvancedSetting: false,
        class: ['cell-12', 'mt-6'],
      },
    ],
  },
};

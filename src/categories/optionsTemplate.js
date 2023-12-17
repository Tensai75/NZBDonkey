export default [
  {
    name: 'categorySettings',
    title: 'Katgorieneinstellungen',
    settings: [
      {
        name: 'type',
        title: 'Kategorienzuordnung',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'select',
        options: [
          { value: 'automatic', text: 'Automatische Kategorienzuordnung' },
          { value: 'manual', text: 'Manuelle Kategorienauswahl' },
          { value: 'default', text: 'Standard Kategorie verwenden' },
        ],
        rules: {
          required: true,
        },
        isAdvancedSetting: false,
      },
      {
        name: 'categories',
        title: 'Kategorien',
        subtitle: '',
        caption: '',
        description: '',
        helptext: '',
        inputType: 'categories',
        options: {
          defaultCategory: {
            title: 'Standard',
            helptext: 'Auswahl der Standard-Kategorie',
          },
          active: {
            title: 'Aktiv',
            helptext:
              'Die aktiven Kategorien werden in der manuellen Kategorienauswahl angezeigt.',
          },
          name: {
            title: 'Name',
            helptext: '',
          },
          regex: {
            title: 'Regulärer Ausdruck (Regex)',
            helptext: `Regulärer Ausdruck für die automatische Kategorienzuordnung.<br />
            Es kann einer in der Liste vorgegebner Ausrdruck verwendet werden oder mit der Auswahl "Eigener" ein eigener Ausdruck eingegeben werden.<br />
            Mit der Auswahl "Aus" wird die Kategorie bei der automatischen Zuordnung übersprungen.<br />
            Die regulären Ausdrücke der Kategorien werden der Reihe nach geprüft und die erste Übereinstimmung als Kategorie verwendet.<br />
            Die Reihenfolge der Kategorien und somit die Reihenfolge der Überprüfung der Ausdrücke kann über "drag&drop" mit dem Button
            <span class="mif-unfold-more border rounded bd-cobalt fg-cobalt outline pl-1 pr-1"></span> angepasst werden.`,
          },
        },
        rules: {},
        isAdvancedSetting: false,
      },
      {
        name: 'fallbackType',
        title: 'Fallback Option',
        subtitle: '',
        caption: '',
        description:
          'Diese Kategorieauswahl wird verwendet, wenn die automatische Kategorienzuordnung fehlschlägt.',
        helptext: '',
        inputType: 'select',
        options: [
          { value: 'manual', text: 'Manuelle Kategorienauswahl' },
          { value: 'default', text: 'Standard Kategorie verwenden' },
          { value: 'none', text: 'Keine Kategorie' },
        ],
        rules: {
          required: true,
        },
        isAdvancedSetting: false,
        disabledOn: [
          { parameter: 'type', value: 'manual' },
          { parameter: 'type', value: 'default' },
        ],
      },
    ],
  },
];

import defaultSettings from './settings.js';
import optionsTemplate from './template.js';
import target from './target.class.js';

export default {
  name: 'Download',
  description: 'im Download-Ordner speichern',
  canHaveCategories: true,
  hasTargetCategories: false,
  defaultSettings: defaultSettings,
  optionsTemplate: optionsTemplate,
  target,
};

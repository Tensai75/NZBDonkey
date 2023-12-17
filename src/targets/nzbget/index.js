import defaultSettings from './settings.js';
import optionsTemplate from './template.js';
import target from './target.class.js';

export default {
  name: 'NZBGet',
  description: 'an NZBGet senden',
  canHaveCategories: true,
  hasTargetCategories: true,
  defaultSettings: defaultSettings,
  optionsTemplate: optionsTemplate,
  target,
};

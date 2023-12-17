import defaultSettings from './settings.js';
import optionsTemplate from './template.js';
import target from './target.class.js';

export default {
  name: 'Synology DownloadStation',
  description: 'an Synology DownloadStation senden',
  canHaveCategories: false,
  hasTargetCategories: false,
  defaultSettings: defaultSettings,
  optionsTemplate: optionsTemplate,
  target,
};

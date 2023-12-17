import defaultSettings from './settings.js';
import optionsTemplate from './template.js';
import target from './target.class.js';

export default {
  name: 'SABnzbd',
  description: 'an SABnzbd senden',
  canHaveCategories: true,
  hasTargetCategories: true,
  defaultSettings: defaultSettings,
  optionsTemplate: optionsTemplate,
  target,
};

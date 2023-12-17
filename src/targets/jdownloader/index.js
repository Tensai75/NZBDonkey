import defaultSettings from './settings.js';
import optionsTemplate from './template.js';
import target from './target.class.js';

export default {
  name: chrome.i18n.getMessage('target_jdownloader_name'),
  description: chrome.i18n.getMessage('target_jdownloader_description'),
  canHaveCategories: false,
  hasTargetCategories: false,
  defaultSettings: defaultSettings,
  optionsTemplate: optionsTemplate,
  target,
};

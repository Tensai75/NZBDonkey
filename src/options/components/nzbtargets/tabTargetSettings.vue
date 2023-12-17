<template>
  <ValidationObserver v-slot="{ invalid }" tag="div" style="display: contents">
    <div
      v-for="template in settingsTemplate"
      v-bind:key="template.name"
      style="display: contents"
    >
      <div
        v-if="currentTab == template.name"
        class="dialog-content"
        style="min-height: 75vh; max-height: 75vh; overflow: auto"
      >
        <div class="row cell-12">
          <h6 class="mt-0">
            {{ template.title }}
          </h6>
        </div>
        <template v-for="setting in template.settings">
          <div
            v-if="!setting.isAdvancedSetting || showAdvancedSettings"
            class="row cell-12"
            v-bind:key="setting.name"
          >
            <inputs
              v-model="target.settings[setting.name]"
              v-bind:settings="setting"
              v-bind:fullSettings="target"
            ></inputs>
          </div>
        </template>
        <categories
          v-if="template.isCategorySetting && target.settings.useCategories"
          v-model="target"
          v-on:noTargetCategories="noTargetCategories()"
          v-on:blur="$emit('blur')"
        >
          Test
        </categories>
        <div v-if="hasNoTargetCategories" class="row cell-12">
          Es müssen zuerst in den Einstellungen von NZBGet Kategorien definiert
          werden, bevor diese Funktion verwendet werden kann.
        </div>
      </div>
      <div
        v-if="currentTab == template.name"
        class="dialog-actions d-flex flex-justify-between"
      >
        <button
          class="button secondary outline rounded"
          v-on:click="$emit('close')"
        >
          Abbrechen
        </button>
        <button
          v-if="template.hasAdvancedSettings"
          v-on:click="toggleAdvancedSettings"
          class="button warning rounded outline"
        >
          {{ showAdvancedSettings ? 'Hide' : 'Show' }} Advanced Settings
        </button>
        <div>
          <button
            v-if="tabIndex > 0"
            v-on:click="back"
            class="button secondary outline rounded mr-2"
          >
            Zurück
          </button>
          <button
            v-on:click="next(template)"
            :class="[
              'button',
              'rounded',
              template.isLast && !template.hasConnectionTest
                ? 'success'
                : 'primary',
            ]"
            v-bind:disabled="invalid"
          >
            {{ template.nextButton }}
          </button>
        </div>
      </div>
    </div>
    <test-connection-dialog
      v-if="showTestConnectionDialog"
      v-model="testConnectionSuccessfull"
      :target="target"
      :template="settingsTemplate[tabIndex]"
      v-on:close="
        showTestConnectionDialog = false;
        testConnectionSuccessfull = false;
      "
      v-on:next="next"
    ></test-connection-dialog>
  </ValidationObserver>
</template>

<script>
import { targets } from '../../../targets/index.js';
import inputs from '../inputs/inputs.vue';
import testConnectionDialog from './testConnectionDialog.vue';
import categories from '../categories/categories.vue';

export default {
  props: ['target'],
  data: function () {
    return {
      targets: targets,
      showAdvancedSettings: false,
      showTestConnectionDialog: false,
      tabIndex: 0,
      currentTab: '',
      testConnectionSuccessfull: false,
      hasNoTargetCategories: false,
    };
  },
  computed: {
    settingsTemplate: function () {
      let settingsTemplate = [];
      let _this = this;
      this.targets[this.target.type].optionsTemplate.forEach(function (
        template,
        index
      ) {
        template.hasAdvancedSettings =
          template.settings.findIndex((setting) => setting.isAdvancedSetting) >=
          0
            ? true
            : false;
        template.isLast =
          _this.targets[_this.target.type].optionsTemplate.length == index + 1;
        settingsTemplate.push({ ...template });
      });
      return settingsTemplate;
    },
    inputValue: {
      get: function () {
        return this.target;
      },
      set: function (value) {
        this.$emit('input', value);
      },
    },
  },
  created: function () {
    this.currentTab =
      this.targets[this.target.type].optionsTemplate[this.tabIndex].name;
  },
  watch: {
    tabIndex: function (index) {
      this.currentTab =
        this.targets[this.target.type].optionsTemplate[index].name;
    },
  },
  components: {
    inputs: inputs,
    testConnectionDialog: testConnectionDialog,
    categories: categories,
  },
  methods: {
    next: function (template) {
      this.$emit('blur');
      if (template.hasConnectionTest && !this.testConnectionSuccessfull) {
        this.testConnection();
      } else if (template.isLast) {
        this.$emit('save');
      } else {
        this.testConnectionSuccessfull = false;
        this.tabIndex = this.tabIndex + 1;
      }
    },
    back: function () {
      this.$emit('blur');
      this.tabIndex = this.tabIndex > 0 ? this.tabIndex - 1 : 0;
    },
    toggleAdvancedSettings: function () {
      this.$emit('blur');
      this.showAdvancedSettings = this.showAdvancedSettings ? false : true;
    },
    testConnection: function () {
      this.$emit('blur');
      this.showTestConnectionDialog = true;
    },
    noTargetCategories: function () {
      this.hasNoTargetCategories = true;
      this.inputValue.settings.useCategories = false;
    },
  },
  model: {
    prop: 'target',
    event: 'input',
  },
};
</script>

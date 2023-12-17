<template>
  <div>
    <div
      v-for="template in settingsTemplate"
      v-bind:key="template.name"
      style="display: contents"
    >
      <template v-for="setting in template.settings">
        <div
          v-if="showItem(setting)"
          class="row cell-12"
          v-bind:key="setting.name"
        >
          <inputs
            v-model="inputValue.settings.categories[setting.name]"
            v-bind:settings="setting"
            v-bind:fullSettings="inputValue"
            v-on:blur="$emit('blur')"
          ></inputs>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { targets } from '../../../targets/index.js';
import optionsTemplate from '../../../categories/optionsTemplate.js';
import defaultSettings from '../../../categories/defaultSettings.js';
import inputs from '../inputs/inputs.vue';

export default {
  props: ['target'],
  data: function () {
    return {
      targets: targets,
      targetCategories: [],
      settingsTemplate: [],
      defaultSettings: defaultSettings,
    };
  },
  computed: {
    inputValue: {
      get: function () {
        return this.target;
      },
      set: function (value) {
        this.$emit('input', value);
      },
    },
  },
  created: async function () {
    // if there are target categories, generate the categories from them
    if (this.targets[this.target.type].hasTargetCategories) {
      this.targetCategories = await this.targets[
        this.target.type
      ].target.getCategories(this.target.settings);
      if (this.targetCategories.length == 0) {
        this.$emit('noTargetCategories');
        return;
      }
      let filter = [];
      this.inputValue.settings.categories.categories.forEach(
        (category, settingsIndex) => {
          let targetIndex = this.targetCategories.findIndex(
            (item) => item == category.name
          );
          if (targetIndex >= 0) {
            this.inputValue.settings.categories.categories[settingsIndex] = {
              active: category.active == true ? true : false,
              name: category.name,
              type: category.type ? category.type : 'none',
              regex: category.regex ? category.regex : '',
            };
            this.targetCategories.splice(targetIndex, 1);
          } else {
            filter.push(settingsIndex);
          }
        }
      );
      this.targetCategories.forEach((category) => {
        this.inputValue.settings.categories.categories.push({
          active: true,
          name: category,
          type: 'none',
          regex: '',
        });
      });
      filter.reverse().forEach((index) => {
        this.inputValue.settings.categories.categories.splice(index, 1);
      });
    }
    // generate the settings template
    let settingsTemplate = [];
    optionsTemplate.forEach((template) => {
      template.settings.forEach((setting) => {
        if (setting.inputType === 'categorySelect') {
          this.categories.forEach((category) => {
            setting.options.push({ value: category, text: category });
          });
          setting.inputType = 'select';
        }
      });
      settingsTemplate.push(template);
    });
    this.settingsTemplate = settingsTemplate;
  },
  watch: {},
  components: {
    inputs: inputs,
  },
  methods: {
    showItem: function (setting) {
      let show = true;
      if (setting.disabledOn) {
        setting.disabledOn.forEach((element) => {
          show =
            this.target.settings.categories[element.parameter] === element.value
              ? false
              : show;
        });
      }
      return show;
    },
  },
  model: {
    prop: 'target',
    event: 'input',
  },
};
</script>

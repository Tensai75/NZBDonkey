<template>
  <div class="row-12" style="margin: -6px -6px 0px -6px">
    <inputs
      v-for="setting in template"
      :key="setting.name"
      :class="[
        setting.class ? setting.class : ['cell-12', 'mt-2', 'my-2', 'w-100'],
      ]"
      v-model="inputValue[settingsName][setting.name]"
      :fullSettings="inputValue"
      :settings="setting"
      quickSettings="true"
    ></inputs>
  </div>
</template>

<script>
import settings from '../settings/settings.js';
import optionTemplate from '../settings/optionsTemplate.js';
import inputs from '../options/components/inputs/inputs.vue';
export default {
  props: ['settingsName'],
  data: function () {
    return {
      settings: window.NZBDONKEY_SETTINGS,
    };
  },
  computed: {
    inputValue: {
      get: function () {
        return this.settings;
      },
      set: async function (value) {
        const result = JSON.parse(JSON.stringify(await value));
        settings.save(result);
      },
    },
    template: function () {
      let template = {};
      for (let key in optionTemplate[this.settingsName].settings) {
        if (optionTemplate[this.settingsName].settings[key].isQuickSetting)
          template[key] = optionTemplate[this.settingsName].settings[key];
      }
      return template;
    },
  },
  components: {
    inputs: inputs,
  },
  watch: {
    // watch settings changes
    inputValue: {
      handler: async function (value) {
        const result = JSON.parse(JSON.stringify(await value));
        settings.save(result);
      },
      deep: true,
    },
  },
};
</script>

<style>
label {
  font-weight: 500;
}
</style>

<template>
  <div class="row mt-4-minus">
    <div
      v-for="setting in optionsTemplate.settings"
      :key="setting.name"
      :class="[setting.class ? setting.class : ['cell-12', 'mt-4']]"
    >
      <inputs
        v-model="settings.general[setting.name]"
        :fullSettings="settings"
        :settings="setting"
        v-on:blur="blur"
      ></inputs>
    </div>
    <div class="cell-12 mt-6">
      <h5 class="mb-2">Einstellungen zurücksetzen</h5>
      <button class="button rounded alert" v-on:click="clearSettingsConfirm()">
        Alle Einstellungen zurücksetzen
      </button>
    </div>
    <div v-if="confirmClearSettings" id="confirmClearSettingsDialog">
      <div class="dialog rounded">
        <div class="dialog-content">
          Wirklich alle Einstellung zurücksetzen?
        </div>
        <div class="dialog-actions d-flex flex-justify-between">
          <button
            class="button rounded primary outline"
            v-on:click="confirmClearSettings = false"
          >
            Abbrechen
          </button>
          <button class="button rounded alert" v-on:click="clearSettings()">
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import settings from '../../../settings/settings.js';
import optionsTemplate from '../../../settings/optionsTemplate.js';
import inputs from '../inputs/inputs.vue';

export default {
  props: ['value'],
  data: function () {
    return {
      optionsTemplate: optionsTemplate.general,
      confirmClearSettings: false,
    };
  },
  computed: {
    settings: {
      get: function () {
        return { ...this.value };
      },
      set: function (value) {
        console.log('general.vue set');
        this.$emit('input', value);
      },
    },
  },
  components: {
    inputs: inputs,
  },
  methods: {
    clearSettingsConfirm: function () {
      this.confirmClearSettings = true;
    },
    clearSettings: function () {
      settings.reset();
      this.confirmClearSettings = false;
      this.blur();
    },
    blur: function () {
      let elem = document.querySelector(':focus');
      if (elem) {
        elem.blur();
      }
    },
  },
};
</script>

<style scoped>
#confirmClearSettingsDialog {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 900;
  display: flex;
  justify-content: center;
  align-items: center;
}

#confirmClearSettingsDialog .dialog {
  width: 300px;
}
</style>

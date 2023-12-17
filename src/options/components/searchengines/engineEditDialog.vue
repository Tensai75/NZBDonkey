<template>
  <div id="engineEditDialog">
    <div class="dialog rounded">
      <div class="dialog-title" v-html="title"></div>
      <tab-engine-settings
        v-if="engine"
        v-model="engine"
        v-on:blur="$emit('blur')"
        v-on:close="$emit('close')"
        v-on:save="saveEngine"
      ></tab-engine-settings>
    </div>
  </div>
</template>

<script>
import defaultSettings from '../../../searchengines/defaultSettings.js';
import tabEngineSettings from './tabEngineSettings.vue';

export default {
  props: ['value', 'index'],
  data: function () {
    return {
      title: 'Suchmaschine bearbeiten',
      engine: false,
      defaultSettings: defaultSettings,
    };
  },
  computed: {
    settings: {
      get: function () {
        return { ...this.value };
      },
      set: function (value) {
        this.$emit('input', value);
      },
    },
  },
  created: function () {
    this.engine = false;
    if (this.index !== false) {
      this.engine = JSON.parse(
        JSON.stringify(this.value.searchengines.engines[this.index])
      );
    } else {
      this.engine = { ...this.defaultSettings };
    }
  },
  components: {
    tabEngineSettings: tabEngineSettings,
  },
  methods: {
    saveEngine: function () {
      if (this.index) {
        this.settings.searchengines.engines[this.index] = this.engine;
      } else {
        this.engine.active = true;
        this.settings.searchengines.engines.push(this.engine);
      }
      this.$emit('input', this.settings);
      this.$emit('blur');
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
#engineEditDialog {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 700;
  display: flex;
  justify-content: center;
  align-items: center;
}

#engineEditDialog .dialog {
  width: 640px;
  max-width: 100vw !important;
}
</style>

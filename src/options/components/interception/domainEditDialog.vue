<template>
  <div id="domainEditDialog">
    <div class="dialog rounded">
      <div class="dialog-title" v-html="title"></div>
      <tab-domain-settings
        v-if="domain"
        v-model="domain"
        v-on:blur="$emit('blur')"
        v-on:close="$emit('close')"
        v-on:save="saveDomain"
      ></tab-domain-settings>
    </div>
  </div>
</template>

<script>
import defaultSettings from '../../../interception/defaultSettings.js';
import tabDomainSettings from './tabDomainSettings.vue';

export default {
  props: ['value', 'index'],
  data: function () {
    return {
      title: 'Einstellungen',
      domain: false,
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
    this.domain = false;
    if (this.index !== false) {
      this.domain = JSON.parse(
        JSON.stringify(this.value.interception.domains[this.index])
      );
    } else {
      this.domain = { ...this.defaultSettings };
    }
  },
  components: {
    tabDomainSettings: tabDomainSettings,
  },
  methods: {
    saveDomain: function () {
      if (this.index) {
        this.settings.interception.domains[this.index] = this.domain;
      } else {
        this.domain.active = true;
        this.settings.interception.domains.push(this.domain);
      }
      this.$emit('input', this.settings);
      this.$emit('blur');
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
#domainEditDialog {
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

#domainEditDialog .dialog {
  width: 640px;
  max-width: 100vw !important;
}
</style>

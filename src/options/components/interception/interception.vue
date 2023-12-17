<template>
  <div class="row mt-4-minus">
    <div
      v-for="setting in optionsTemplate.settings"
      :key="setting.name"
      class="cell-12 mt-4"
    >
      <inputs
        v-model="settings.interception[setting.name]"
        :fullSettings="settings"
        :settings="setting"
        v-on:deleteDomain="deleteDomain"
        v-on:editDomain="editDomain"
        v-on:blur="blur"
      ></inputs>
    </div>
    <div v-if="settings.interception.enabled" class="cell-12">
      <button class="button outline primary rounded" v-on:click="editDomain()">
        {{ addDomain }}
      </button>
    </div>
    <domain-edit-dialog
      v-if="domainEditShow"
      v-model="settings"
      v-bind:index="domain"
      v-on:close="domainEditShow = false"
      v-on:blur="blur"
    ></domain-edit-dialog>
  </div>
</template>

<script>
import optionsTemplate from '../../../settings/optionsTemplate.js';
import domainEditDialog from './domainEditDialog.vue';
import inputs from '../inputs/inputs.vue';

export default {
  props: ['value'],
  data: function () {
    return {
      addDomain: 'Domain hinzufügen',
      domainEditShow: false,
      domain: false,
      optionsTemplate: optionsTemplate.interception,
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
  components: {
    inputs: inputs,
    domainEditDialog: domainEditDialog,
  },
  methods: {
    editDomain: function (index = false) {
      this.blur();
      this.domain = index;
      this.domainEditShow = true;
    },
    deleteDomain: function (index) {
      this.blur();
      this.settings.searchdomain.domains.splice(index, 1);
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

<style></style>

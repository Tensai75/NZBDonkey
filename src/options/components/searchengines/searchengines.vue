<template>
  <div class="row mt-4-minus">
    <div
      v-for="setting in optionsTemplate.settings"
      :key="setting.name"
      class="cell-12 mt-4"
    >
      <inputs
        v-model="settings.searchengines[setting.name]"
        :fullSettings="settings"
        :settings="setting"
        v-on:deleteEngine="deleteEngine"
        v-on:editEngine="editEngine"
        v-on:blur="blur"
      ></inputs>
    </div>
    <div class="cell-12">
      <button class="button outline primary rounded" v-on:click="editEngine()">
        {{ addEngine }}
      </button>
    </div>
    <engine-edit-dialog
      v-if="engineEditShow"
      v-model="settings"
      v-bind:index="engine"
      v-on:close="engineEditShow = false"
      v-on:blur="blur"
    ></engine-edit-dialog>
  </div>
</template>

<script>
import optionsTemplate from '../../../settings/optionsTemplate.js';
import engineEditDialog from './engineEditDialog.vue';
import inputs from '../inputs/inputs.vue';

export default {
  props: ['value'],
  data: function () {
    return {
      addEngine: 'Suchmaschine hinzufügen',
      engineEditShow: false,
      engine: false,
      optionsTemplate: optionsTemplate.searchengines,
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
    engineEditDialog: engineEditDialog,
  },
  methods: {
    editEngine: function (index = false) {
      this.blur();
      this.engine = index;
      this.engineEditShow = true;
    },
    deleteEngine: function (index) {
      this.blur();
      this.settings.searchengine.engines.splice(index, 1);
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

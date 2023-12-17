<template>
  <div class="row mt-4-minus">
    <div
      v-for="setting in targetsOptionsTemplate.settings"
      :key="setting.name"
      class="cell-12 mt-4"
    >
      <inputs
        v-model="settings.target[setting.name]"
        :fullSettings="settings"
        :settings="setting"
        v-on:deleteTarget="deleteTarget"
        v-on:editTarget="editTarget"
        v-on:blur="blur"
      ></inputs>
    </div>
    <div class="cell-12">
      <button class="button outline primary rounded" v-on:click="editTarget()">
        {{ addTarget }}
      </button>
    </div>
    <targets-edit-dialog
      v-if="targetEditShow"
      v-model="settings"
      v-bind:index="target"
      v-on:close="targetEditShow = false"
      v-on:blur="blur"
    ></targets-edit-dialog>
  </div>
</template>

<script>
import optionsTemplate from '../../../settings/optionsTemplate.js';
import targetEditDialog from './targetEditDialog.vue';
import inputs from '../inputs/inputs.vue';

export default {
  props: ['value'],
  data: function () {
    return {
      addTarget: 'NZB-Datei Ziel hinzufügen',
      targetEditShow: false,
      target: false,
      targetsOptionsTemplate: optionsTemplate.target,
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
    targetsEditDialog: targetEditDialog,
  },
  methods: {
    editTarget: function (index = false) {
      this.blur();
      this.target = index;
      this.targetEditShow = true;
    },
    deleteTarget: function (index) {
      this.blur();
      this.settings.target.targets.splice(index, 1);
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

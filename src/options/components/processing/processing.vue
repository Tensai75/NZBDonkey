<template>
  <div class="row mt-4-minus">
    <div
      v-for="setting in optionsTemplate.settings"
      :key="setting.name"
      :class="[setting.class ? setting.class : ['cell-12', 'mt-4']]"
    >
      <inputs
        v-model="settings.processing[setting.name]"
        :fullSettings="settings"
        :settings="setting"
        v-on:blur="blur"
      ></inputs>
    </div>
  </div>
</template>

<script>
import optionsTemplate from '../../../settings/optionsTemplate.js';
import inputs from '../inputs/inputs.vue';

export default {
  props: ['value'],
  data: function () {
    return {
      optionsTemplate: optionsTemplate.processing,
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
  },
  methods: {
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

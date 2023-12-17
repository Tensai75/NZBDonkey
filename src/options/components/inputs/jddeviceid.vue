<template>
  <select
    :name="settings.name"
    :class="['rounded', validation.valid ? '' : 'invalid']"
    v-on:input="setDevice($event.target.value)"
  >
    <option
      v-for="option in devices"
      :value="option.id"
      :key="option.id"
      :selected="option.id === inputValue.id ? true : false"
    >
      {{ option.name }}
    </option>
  </select>
</template>

<script>
import jdownloader from '../../../targets/jdownloader/target.class.js';
export default {
  props: ['value', 'settings', 'fullSettings', 'validation'],
  data: function () {
    return {
      devices: {},
    };
  },
  computed: {
    inputValue: {
      get: function () {
        return this.value;
      },
      set: function (value) {
        this.setDevice(value);
      },
    },
  },
  created: async function () {
    this.devices = await jdownloader.getDevices(this.fullSettings.settings);
    if (!this.devices.find((device) => device.id === this.value.id)) {
      this.inputValue = this.devices[0].id;
      this.setDevice(this.inputValue);
    }
  },
  methods: {
    setDevice: function (id) {
      this.$emit('input', {
        id: id,
        name: this.devices.find((device) => device.id === id).name,
      });
    },
  },
};
</script>

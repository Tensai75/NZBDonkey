<template>
  <ValidationProvider
    v-if="isVisible"
    :rules="settings.rules"
    immediate
    v-slot="validation"
    tag="span"
    class="w-100"
  >
    <!-- Input Title -->
    <label v-if="settings.title" :for="settings.name">
      <b>{{ settings.title }}</b>
      <small v-if="settings.subtitle"> ({{ settings.subtitle }})</small>
      <helptext :helptext="settings.helptext"></helptext>
    </label>

    <!-- Select Input -->
    <input-select
      v-if="settings.inputType == 'select'"
      v-model="inputValue"
      :settings="settings"
      :validation="validation"
    ></input-select>

    <!-- Radio Input -->
    <input-radio
      v-if="settings.inputType == 'radio'"
      v-model="inputValue"
      :settings="settings"
      :validation="validation"
    ></input-radio>

    <!-- Text Input -->
    <input-text
      v-if="settings.inputType == 'text'"
      v-model="inputValue"
      :settings="settings"
      :validation="validation"
    ></input-text>

    <!-- Number Input -->
    <input-number
      v-if="settings.inputType == 'number'"
      v-model="inputValue"
      :settings="settings"
      :validation="validation"
    ></input-number>

    <!-- Slider Input -->
    <input-slider
      v-if="settings.inputType == 'slider'"
      v-model="inputValue"
      :settings="settings"
      :validation="validation"
    ></input-slider>

    <!-- Switch Input -->
    <input-switch
      v-if="settings.inputType == 'switch'"
      v-model="inputValue"
      :settings="settings"
      :validation="validation"
    ></input-switch>

    <!-- Targets Input -->
    <input-targets
      v-if="settings.inputType == 'targets'"
      v-model="inputValue"
      :settings="settings"
      :fullSettings="fullSettings"
      :validation="validation"
      v-on:deleteTarget="$emit('deleteTarget', arguments[0])"
      v-on:editTarget="$emit('editTarget', arguments[0])"
      v-on:blur="$emit('blur')"
    ></input-targets>

    <!-- JdDeviceID Input -->
    <input-jd-device-id
      v-if="settings.inputType == 'jdDeviceID'"
      v-model="inputValue"
      :settings="settings"
      :fullSettings="fullSettings"
      :validation="validation"
    ></input-jd-device-id>

    <!-- Engines Input -->
    <input-engines
      v-if="settings.inputType == 'engines'"
      v-model="inputValue"
      :settings="settings"
      :fullSettings="fullSettings"
      :validation="validation"
      v-on:deleteEngine="$emit('deleteEngine', arguments[0])"
      v-on:editEngine="$emit('editEngine', arguments[0])"
      v-on:blur="$emit('blur')"
    ></input-engines>

    <!-- Domains Input -->
    <input-domains
      v-if="settings.inputType == 'domains'"
      v-model="inputValue"
      :settings="settings"
      :fullSettings="fullSettings"
      :validation="validation"
      v-on:deleteDomain="$emit('deleteDomain', arguments[0])"
      v-on:editDomain="$emit('editDomain', arguments[0])"
      v-on:blur="$emit('blur')"
    ></input-domains>

    <!-- Categories Input -->
    <input-categories
      v-if="settings.inputType == 'categories'"
      v-model="inputValue"
      :settings="settings"
      :fullSettings="fullSettings"
      :validation="validation"
      v-on:deleteCategory="$emit('deleteCategory', arguments[0])"
      v-on:editCategory="$emit('editCategory', arguments[0])"
      v-on:blur="$emit('blur')"
    ></input-categories>

    <span class="invalid_feedback" :hidden="!validation.valid">
      {{ validation.errors[0] }}
    </span>
    <small
      v-if="settings.description"
      v-html="settings.description"
      :hidden="popup"
    ></small>
  </ValidationProvider>
</template>

<script>
import jsonpath from 'jsonpath';
import inputSelect from './select.vue';
import inputRadio from './radio.vue';
import inputText from './text.vue';
import inputNumber from './number.vue';
import inputSlider from './slider.vue';
import inputSwitch from './switch.vue';
import inputTargets from './targets.vue';
import inputJdDeviceId from './jddeviceid.vue';
import inputEngines from './engines.vue';
import inputDomains from './domains.vue';
import inputCategories from './categories.vue';
import helptext from './helptext.vue';

export default {
  props: ['value', 'settings', 'fullSettings'],
  data: function () {
    return {
      popup: window.NZBDONKEY_SCRIPT == 'action' ? true : false,
    };
  },
  computed: {
    inputValue: {
      get: function () {
        return this.value;
      },
      set: function (value) {
        this.$emit('input', value);
      },
    },
    isVisible: function () {
      let value = true;
      if (
        this.settings.dontShowIf &&
        Array.isArray(this.settings.dontShowIf) &&
        this.settings.dontShowIf.length > 0
      ) {
        this.settings.dontShowIf.forEach((item) => {
          if (
            item.value ==
            jsonpath.nodes(this.fullSettings, `$.${item.parameter}`)[0].value
          ) {
            value = false;
          }
        });
      }
      return value;
    },
  },
  components: {
    inputRadio: inputRadio,
    inputSelect: inputSelect,
    inputText: inputText,
    inputNumber: inputNumber,
    inputSlider: inputSlider,
    inputSwitch: inputSwitch,
    inputTargets: inputTargets,
    inputJdDeviceId: inputJdDeviceId,
    inputEngines: inputEngines,
    inputDomains: inputDomains,
    inputCategories: inputCategories,
    helptext: helptext,
  },
  created: function () {},
  methods: {},
};
</script>

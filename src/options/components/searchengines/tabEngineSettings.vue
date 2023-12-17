<template>
  <ValidationObserver v-slot="{ invalid }" tag="div" style="display: contents">
    <div
      v-for="template in settingsTemplate"
      v-bind:key="template.name"
      style="display: contents"
    >
      <div
        v-if="currentTab == template.name"
        class="dialog-content"
        style="min-height: 75vh; max-height: 75vh; overflow: auto"
      >
        <div v-if="template.title" class="row cell-12">
          <h6 class="mt-0">
            {{ template.title }}
          </h6>
        </div>
        <template v-for="setting in template.settings">
          <div
            v-if="showItem(setting)"
            :class="setting.class ? setting.class : ['row', 'cell-12']"
            v-bind:key="setting.name"
          >
            <inputs
              v-model="engine[setting.name]"
              v-bind:settings="setting"
            ></inputs>
          </div>
        </template>
      </div>
      <div
        v-if="currentTab == template.name"
        class="dialog-actions d-flex flex-justify-between"
      >
        <button
          class="button secondary outline rounded"
          v-on:click="$emit('close')"
        >
          Abbrechen
        </button>
        <div>
          <button
            v-if="tabIndex > 0"
            v-on:click="back"
            class="button secondary outline rounded mr-2"
          >
            Zurück
          </button>
          <button
            v-on:click="next(template)"
            class="button primary rounded"
            v-bind:disabled="invalid"
          >
            {{ template.nextButton }}
          </button>
        </div>
      </div>
    </div>
    <test-engine-dialog
      v-if="showTestEngineDialog"
      v-model="engineTestSuccessfull"
      :engine="engine"
      :template="settingsTemplate[tabIndex]"
      v-on:close="
        showTestEngineDialog = false;
        engineTestSuccessfull = false;
      "
      v-on:next="next"
      v-on:blur="$emit('blur')"
    ></test-engine-dialog>
  </ValidationObserver>
</template>

<script>
import inputs from '../inputs/inputs.vue';
import testEngineDialog from './testEngineDialog.vue';
import optionsTemplate from '../../../searchengines/optionsTemplate.js';

export default {
  props: ['engine'],
  data: function () {
    return {
      tabIndex: 0,
      currentTab: '',
      showTestEngineDialog: false,
      engineTestSuccessfull: false,
    };
  },
  computed: {
    settingsTemplate: function () {
      let settingsTemplate = [];
      optionsTemplate.forEach(function (template, index) {
        template.isLast = index + 1 == optionsTemplate.length ? true : false;
        settingsTemplate.push({ ...template });
      });
      return settingsTemplate;
    },
  },
  watch: {
    tabIndex: function (index) {
      this.currentTab = this.settingsTemplate[index].name;
    },
  },
  created: function () {
    this.currentTab = this.settingsTemplate[this.tabIndex].name;
  },
  components: {
    inputs: inputs,
    testEngineDialog: testEngineDialog,
  },
  methods: {
    next: function (template) {
      this.$emit('blur');
      if (template.hasEngineTest && !this.engineTestSuccessfull) {
        this.testEngine();
      } else if (template.isLast) {
        this.$emit('save');
      } else {
        this.tabIndex = this.tabIndex + 1;
      }
    },
    back: function () {
      this.$emit('blur');
      this.tabIndex = this.tabIndex > 0 ? this.tabIndex - 1 : 0;
    },
    testEngine: function () {
      this.$emit('blur');
      this.showTestEngineDialog = true;
    },
    showItem: function (setting) {
      let show = true;
      if (setting.disabledOn) {
        setting.disabledOn.forEach((element) => {
          show =
            this.engine[element.parameter] === element.value ? false : show;
        });
      }
      return show;
    },
  },
  model: {
    prop: 'engine',
    event: 'input',
  },
};
</script>

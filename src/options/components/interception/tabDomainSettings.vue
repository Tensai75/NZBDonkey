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
        style="min-height: 60vh; max-height: 60vh; overflow: auto"
      >
        <div v-if="template.title" class="row cell-12">
          <h6 class="mt-0">
            {{ template.title }}
          </h6>
        </div>
        <template v-for="setting in template.settings">
          <div
            v-if="showItem(setting)"
            :class="[setting.class ? setting.class : 'row']"
            v-bind:key="setting.name"
          >
            <inputs
              v-model="domain[setting.name]"
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
            v-on:click="next(template)"
            class="button rounded success"
            v-bind:disabled="invalid"
          >
            {{ template.nextButton }}
          </button>
        </div>
      </div>
    </div>
  </ValidationObserver>
</template>

<script>
import inputs from '../inputs/inputs.vue';
import optionsTemplate from '../../../interception/optionsTemplate.js';

export default {
  props: ['domain'],
  data: function () {
    return {
      tabIndex: 0,
      currentTab: '',
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
  },
  methods: {
    next: function (template) {
      this.$emit('blur');
      if (template.hasDomainTest && !this.domainTestSuccessfull) {
        this.testDomain();
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
    showItem: function (setting) {
      let show = true;
      if (setting.disabledOn) {
        setting.disabledOn.forEach((element) => {
          show =
            this.domain[element.parameter] === element.value ? false : show;
        });
      }
      return show;
    },
  },
  model: {
    prop: 'domain',
    event: 'input',
  },
};
</script>

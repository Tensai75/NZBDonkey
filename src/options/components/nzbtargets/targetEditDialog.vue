<template>
  <div id="targetEditDialog">
    <div class="dialog rounded">
      <div class="dialog-title" v-html="title"></div>
      <tab-select-target
        v-if="target === false"
        v-model="targetType"
        v-on:next="setDefaultSettings"
        v-on:close="$emit('close')"
      ></tab-select-target>
      <tab-target-settings
        v-if="target"
        v-model="target"
        v-on:blur="$emit('blur')"
        v-on:close="$emit('close')"
        v-on:save="saveTarget"
      ></tab-target-settings>
    </div>
  </div>
</template>

<script>
import { targets } from '../../../targets/index.js';
import tabSelectTarget from './tabSelectTarget.vue';
import tabTargetSettings from './tabTargetSettings.vue';

export default {
  props: ['value', 'index'],
  data: function () {
    return {
      title: 'NZB-Datei Ziel auswählen',
      targets: targets,
      target: false,
      targetType: '',
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
    this.target = false;
    if (this.index !== false) {
      this.target = JSON.parse(
        JSON.stringify(this.value.target.targets[this.index])
      );
      this.setTitle(this.target.type);
    }
  },
  components: {
    tabSelectTarget: tabSelectTarget,
    tabTargetSettings: tabTargetSettings,
  },
  methods: {
    setTitle: function (type) {
      this.title =
        '<img src="/img/' +
        type +
        '.png" style="width: 30px; height: 30px; margin: -5px 10px 0px 0px;">' +
        this.targets[type].name +
        ' Einstellungen';
    },
    setDefaultSettings: function () {
      this.target = {
        type: this.targetType,
        settings: JSON.parse(
          JSON.stringify(this.targets[this.targetType].defaultSettings)
        ),
      };
      this.setTitle(this.targetType);
    },
    saveTarget: function () {
      if (this.index !== false) {
        this.settings.target.targets[this.index] = this.target;
      } else {
        this.target.active = true;
        this.target.name = this.targets[this.target.type].name;
        this.target.name += this.target.settings.host
          ? ' auf ' + this.target.settings.host
          : '';
        this.settings.target.targets.push(this.target);
      }
      this.$emit('input', this.settings);
      this.$emit('blur');
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
#targetEditDialog {
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

#targetEditDialog .dialog {
  width: 800px;
  max-width: 100vw !important;
}
</style>

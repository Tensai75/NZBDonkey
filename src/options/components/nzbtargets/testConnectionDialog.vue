<template>
  <div id="testConnectionDialog">
    <div class="dialog rounded">
      <div class="dialog-title">{{ title }}</div>
      <div class="dialog-content">
        <div
          class="row d-flex h-100 flex-align-stretch flex-justify-center flex-align-center"
        >
          <div
            v-if="connecting"
            class="cell-12 h-100 d-flex flex-justify-center flex-align-center fg-cobalt"
          >
            <div class="mif-spinner2 ani-spin" style="font-size: 50px"></div>
          </div>
          <div v-if="success" class="cell-12 h-100 text-center">
            <div class="mif-checkmark mif-5x fg-green"></div>
            <br />
            <div>{{ successInfo }}</div>
          </div>
          <div v-if="error" class="cell-12 h-100 text-center">
            <div class="mif-cancel mif-5x fg-red"></div>
            <br />
            <div v-html="error"></div>
          </div>
        </div>
      </div>
      <div class="dialog-actions d-flex flex-justify-between">
        <button v-on:click="close" class="button secondary outline rounded">
          Zurück
        </button>
        <button
          v-on:click="next"
          :class="[
            'button',
            'rounded',
            template.isLast ? 'success' : 'primary',
          ]"
          :disabled="!success"
        >
          {{ nextButton }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { targets } from '../../../targets/index.js';

export default {
  props: ['value', 'target', 'isLastTab', 'template'],
  data: function () {
    return {
      title: 'Verbindungstest',
      successInfo: 'Verbindung erfolgreich!',
      nextButton: this.template.isLast ? 'Speichern' : 'Weiter',
      targets: targets,
      connecting: true,
      error: false,
      success: false,
    };
  },
  watch: {
    value: function (value) {
      this.success = value.toString();
    },
  },
  created: async function () {
    try {
      await this.targets[this.target.type].target.testconnection(
        this.target.settings
      );
      this.connecting = false;
      this.$emit('input', true);
    } catch (e) {
      this.connecting = false;
      this.$emit('input', false);
      this.error = 'Fehler bei der Verbindung!<br />' + e.message;
    }
  },
  methods: {
    close: function () {
      this.$emit('close');
    },
    next: function () {
      this.$emit('next', this.template);
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
#testConnectionDialog {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 900;
  display: flex;
  justify-content: center;
  align-items: center;
}

#testConnectionDialog .dialog {
  width: 300px;
}

#testConnectionDialog .dialog-content {
  min-height: 150px;
  overflow: auto;
}
</style>

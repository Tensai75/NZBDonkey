<template>
  <div class="row mt-4-minus">
    <div v-if="settings.general.nzbLog" class="cell-12">
      <h5 class="mb-2">NZB Log</h5>
      <div>
        <button class="button rounded primary mr-2" v-on:click="showLog('nzb')">
          Show NZB Log
        </button>
        <button
          class="button rounded alert"
          v-on:click="clearLogConfirm('nzb')"
        >
          Clear NZB Log
        </button>
      </div>
    </div>
    <div v-if="settings.general.debug" class="cell-12">
      <h5 class="mb-2">Debug Log</h5>
      <div>
        <button
          class="button rounded primary mr-2"
          v-on:click="showLog('debug')"
        >
          Show Debug Log
        </button>
        <button
          class="button rounded alert"
          v-on:click="clearLogConfirm('debug')"
        >
          Clear Debug Log
        </button>
      </div>
    </div>
    <div
      v-if="!settings.general.nzbLog && !settings.general.debug"
      class="cell-12"
    >
      No logs activated!
    </div>
    <log
      v-if="showLogs"
      v-on:close="showLogs = false"
      v-on:blur="blur()"
      :logName="logName"
    ></log>
    <div v-if="confirmClearLog" id="confirmClearLogDialog">
      <div class="dialog rounded">
        <div class="dialog-content">Protokoll wirklich löschen?</div>
        <div class="dialog-actions d-flex flex-justify-between">
          <button
            class="button rounded primary outline"
            v-on:click="confirmClearLog = false"
          >
            Abbrechen
          </button>
          <button class="button rounded alert" v-on:click="clearLog()">
            Löschen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import debugLog from '../../logger/debugLog.js';
import nzbLog from '../../logger/nzbLog.js';
import logComponent from '../../logger/logDialog.vue';

export default {
  props: ['value'],
  data: function () {
    return {
      showLogs: false,
      logName: 'debug',
      settings: window.NZBDONKEY_SETTINGS,
      confirmClearLog: false,
    };
  },
  computed: {},
  components: {
    log: logComponent,
  },
  methods: {
    blur: function () {
      let elem = document.querySelector(':focus');
      if (elem) {
        elem.blur();
      }
    },
    clearLogConfirm: function (log) {
      this.confirmClearLog = true;
      this.logName = log;
    },
    clearLog: function () {
      this.confirmClearLog = false;
      this.logName == 'debug'
        ? debugLog.clear()
        : this.logName == 'nzb'
        ? nzbLog.clear()
        : '';
      this.blur();
    },
    showLog: function (log) {
      this.logName = log;
      this.showLogs = true;
      this.blur();
    },
  },
};
</script>

<style scoped>
#confirmClearLogDialog {
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

#confirmClearLogDialog .dialog {
  width: 300px;
}
</style>

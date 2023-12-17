<template>
  <div id="logDialog">
    <div class="dialog rounded">
      <div class="dialog-title">{{ title }}</div>
      <div class="dialog-content mt-0 pt-0">
        <nzb-log-table
          v-if="this.loaded && logName == 'nzb' && log.length > 0"
          v-model="log"
        ></nzb-log-table>
        <debug-log-table
          v-if="this.loaded && logName == 'debug' && log.length > 0"
          v-model="log"
        ></debug-log-table>
        <div v-if="this.loaded && log.length == 0">
          No log entries available
        </div>
        <div v-if="!this.loaded">Loading...</div>
      </div>
      <div class="dialog-actions d-flex flex-justify-between">
        <button v-on:click="copy" class="button secondary outline rounded">
          Log ins Clipboard kopieren
        </button>
        <button v-on:click="save" class="button secondary outline rounded">
          Log speichern
        </button>
        <button v-on:click="close" class="button secondary rounded">
          Schliessen
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import nzbLog from './nzbLog.js';
import nzbLogTable from './nzbLogTable.vue';
import debugLog from './debugLog.js';
import debugLogTable from './debugLogTable.vue';
import { logDateFormat } from '../functions/functions.js';
import download from '../targets/download/target.class.js';

export default {
  props: ['logName'],
  data: function () {
    return {
      title: this.logName == 'debug' ? 'Debug Log' : 'NZB Log',
      log: [],
      loaded: false,
    };
  },
  created: async function () {
    let log =
      this.logName == 'debug' ? await debugLog.get() : await nzbLog.get();
    this.log = log.reverse();
    this.loaded = true;
  },
  components: {
    debugLogTable: debugLogTable,
    nzbLogTable: nzbLogTable,
  },
  methods: {
    blur: function () {
      let elem = document.querySelector(':focus');
      if (elem) {
        elem.blur();
      }
    },
    close: function () {
      this.$emit('close');
    },
    date: function (date) {
      return logDateFormat(new Date(date));
    },
    copy: async function () {
      const type = 'text/plain';
      const blob = new Blob([this.getLog()], { type });
      // eslint-disable-next-line no-undef
      const data = [new ClipboardItem({ [type]: blob })];
      navigator.clipboard.write(data);
      this.blur();
    },
    save: function () {
      const blob = new Blob([this.getLog()], {
        type: 'text/txt;charset=utf-8',
      });
      download.save({
        filename: this.logName == 'debug' ? 'debuglog.txt' : 'nzblog.txt',
        blob,
      });
      this.blur();
    },
    getLog: function () {
      let log = '';
      this.log.forEach((item) => {
        if (this.logName == 'debug') {
          log += `${this.date(item.date)}\t${item.type}\t${item.text}\t${
            item.source
          }\n`;
        }
        if (this.logName == 'nzb') {
          log += `${this.date(item.date)}\t${item.title}\t${item.header}\t${
            item.password
          }\t${item.source}\t${item.engine}\t${item.target}\t${item.status}\t${
            item.error
          }\n`;
        }
      });
      return log;
    },
  },
};
</script>

<style scoped>
#logDialog {
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

#logDialog .dialog {
  width: 800px;
}

#logDialog .dialog-content {
  min-height: 150px;
  overflow: auto;
}
td.date {
  white-space: nowrap;
}
.warn {
  background-color: rgba(255, 225, 0, 0.1);
}
.error {
  background-color: rgba(255, 0, 0, 0.1);
}
</style>

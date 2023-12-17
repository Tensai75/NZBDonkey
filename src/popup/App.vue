<template>
  <div class="dialog rounded">
    <div id="dialogTitle" class="dialog-title m-0 p-0">
      <ul
        class="h-menu bg-white fg-dark d-flex flex-row flex-justify-between px-4 py-1"
      >
        <li class="mr-auto d-flex flex-align-center disabled">
          <img
            :src="icon"
            title="NZBDonkey"
            class="mr-2"
            style="width: 32px !important; height: 32px !important"
          />
          <h2 class="flex-self-center m-0 fg-dark">{{ text.dialogTitle }}</h2>
        </li>
        <li class="menu">
          <a
            v-if="settings.general.nzbLog || settings.general.debug"
            href="#"
            class="dropdown-toggle"
            >{{ text.popupMenuLog }}</a
          >
          <ul class="d-menu" data-role="dropdown" style="right: 0px">
            <li v-if="settings.general.nzbLog">
              <a href="#" v-on:click="showContent('nzbLog')">{{
                text.nzbLog
              }}</a>
            </li>
            <li v-if="settings.general.debug">
              <a href="#" v-on:click="showContent('debugLog')">{{
                text.debugLog
              }}</a>
            </li>
          </ul>
        </li>
        <li class="menu">
          <a href="#" class="dropdown-toggle">{{
            text.popupMenuQuickSettings
          }}</a>
          <ul class="d-menu" data-role="dropdown" style="right: 0px">
            <li>
              <a href="#" v-on:click="showContent('quickSettings', 'target')">{{
                text.target
              }}</a>
            </li>
            <li>
              <a
                href="#"
                v-on:click="showContent('quickSettings', 'searchengines')"
              >
                {{ text.searchengines }}
              </a>
            </li>
            <li>
              <a
                href="#"
                v-on:click="showContent('quickSettings', 'interception')"
              >
                {{ text.interception }}
              </a>
            </li>
            <li>
              <a href="#" v-on:click="showContent('quickSettings', 'general')">
                {{ text.general }}
              </a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
    <div id="dialogContent" class="dialog-content m-1 px-4">
      <div v-if="show.nzbLog">
        <h6 class="mt-0 mb-5">{{ text.nzbLog }}</h6>
        <nzb-log-table v-model="nzbLog" class=""></nzb-log-table>
      </div>
      <div v-if="show.debugLog">
        <h6 class="mt-0 mb-5">{{ text.debugLog }}</h6>
        <debug-log-table v-model="debugLog" class=""></debug-log-table>
      </div>
      <div v-if="show.quickSettings">
        <h6 class="mt-0 mb-3">{{ text[show.quickSettings] }}</h6>
        <quick-settings :settingsName="show.quickSettings"></quick-settings>
      </div>
    </div>
    <div id="dialogActions" class="dialog-actions d-flex flex-justify-between">
      <button v-on:click="close" class="button secondary outline rounded">
        {{ text.close }}
      </button>
      <button
        v-if="show.debugLog || show.nzbLog"
        v-on:click="copy"
        class="button secondary outline rounded"
      >
        Ins Clipboard kopieren
      </button>
      <button
        v-if="show.debugLog || show.nzbLog"
        v-on:click="save"
        class="button secondary outline rounded"
      >
        Speichern
      </button>
      <button v-on:click="openSettings" class="button primary rounded">
        {{ text.openSettings }}
      </button>
    </div>
  </div>
</template>

<script>
import debugLogTable from '../logger/debugLogTable.vue';
import nzbLogTable from '../logger/nzbLogTable.vue';
import quickSettings from './quickSettings.vue';
import download from '../targets/download/target.class.js';
import debugLog from '../logger/debugLog.js';
import nzbLog from '../logger/nzbLog.js';
import { logDateFormat } from '../functions/functions.js';

export default {
  name: 'App',
  props: [],
  data: function () {
    return {
      show: {
        nzbLog: false,
        debugLog: false,
        quickSettings: false,
      },
      settings: window.NZBDONKEY_SETTINGS,
      icon: browser.runtime.getURL('/icons/NZBDonkey_32.png'),
      text: {
        dialogTitle: chrome.i18n.getMessage('general_extensionName'),
        popupMenuQuickSettings: chrome.i18n.getMessage(
          'popup_menuQuicksettings'
        ),
        popupMenuLog: chrome.i18n.getMessage('popup_menuLogs'),
        nzbLog: chrome.i18n.getMessage('popup_menuNzblog'),
        debugLog: chrome.i18n.getMessage('popup_menuDebuglog'),
        target: chrome.i18n.getMessage('settings_targetTitle'),
        searchengines: chrome.i18n.getMessage('settings_searchenginesTitle'),
        interception: chrome.i18n.getMessage('settings_interceptionTitle'),
        general: chrome.i18n.getMessage('settings_generalTitle'),
        close: chrome.i18n.getMessage('general_close'),
        openSettings: chrome.i18n.getMessage('general_openSettings'),
      },
      debugLog: [],
      nzbLog: [],
    };
  },
  computed: {},
  created: async function () {
    this.loadLogs;
    this.settings.general.nzbLog
      ? this.showContent('nzbLog')
      : this.settings.general.debug
      ? this.showContent('debugLog')
      : this.showContent('quickSettings', 'target');
    setInterval(this.loadLogs, 200);
  },
  methods: {
    loadLogs: async function () {
      if (this.settings.general.debug) {
        let _debugLog = await debugLog.get();
        this.debugLog = _debugLog.reverse();
      }
      if (this.settings.general.nzbLog) {
        let _nzbLog = await nzbLog.get();
        this.nzbLog = _nzbLog.reverse();
      }
    },
    close: function () {
      window.close();
    },
    openSettings: function () {
      browser.runtime.openOptionsPage();
      window.close();
    },
    showContent: function (item, value = true) {
      for (var key in this.show) {
        this.show[key] = false;
      }
      this.show[item] = value;
    },
    copy: async function () {
      let log = '';
      if (this.show.debugLog) {
        this.debugLog.forEach((item) => {
          log += `${this.date(item.date)}\t${item.type}\t${item.text}\t${
            item.source
          }\n`;
        });
      }
      if (this.show.nzbLog) {
        this.nzbLog.forEach((item) => {
          log += `${this.date(item.date)}\t${item.title}\t${item.header}\t${
            item.password
          }\t${item.source}\t${item.engine}\t${item.target}\t${item.status}\t${
            item.error
          }\n`;
        });
      }
      const type = 'text/plain';
      const blob = new Blob([log], { type });
      // eslint-disable-next-line no-undef
      const data = [new ClipboardItem({ [type]: blob })];
      navigator.clipboard.write(data);
    },
    save: function () {
      let log = '';
      if (this.show.debugLog) {
        this.debugLog.forEach((item) => {
          log += `${this.date(item.date)}\t${item.type}\t${item.text}\t${
            item.source
          }\n`;
        });
      }
      if (this.show.nzbLog) {
        this.nzbLog.forEach((item) => {
          log += `${this.date(item.date)}\t${item.title}\t${item.header}\t${
            item.password
          }\t${item.source}\t${item.engine}\t${item.target}\t${item.status}\t${
            item.error
          }\n`;
        });
      }
      const blob = new Blob([log], {
        type: 'text/txt;charset=utf-8',
      });
      download.save({
        filename: this.show.debugLog ? 'debuglog.txt' : 'nzblog.txt',
        blob,
      });
      this.$emit('blur');
    },
    date: function (date) {
      return logDateFormat(new Date(date));
    },
  },
  components: {
    debugLogTable: debugLogTable,
    nzbLogTable: nzbLogTable,
    quickSettings: quickSettings,
  },
  watch: {},
};
</script>

<style>
html,
body {
  width: 780px;
  height: 580px;
}
.dialog,
.dialog-content,
.content {
  min-width: 100%;
  height: 100%;
  border: 0px;
}
.dialog-content {
  height: 100%;
}
.dialog {
  min-height: 100%;
}
.dialog-content {
  max-height: 100%;
  overflow: auto;
}
.dialog .dialog-actions {
  border-top: 1px solid #e9e9e9;
}
label {
  font-weight: 500;
}

.h-menu > li.menu {
  margin-left: 20px;
  background-color: #e5e5e5;
}
.h-menu > li.menu:hover {
  background-color: rgb(0, 102, 242);
}

.h-menu > li > a {
  color: rgb(29, 29, 29);
}
.h-menu > li > a.dropdown-toggle::before {
  border-color: rgb(29, 29, 29);
  color: rgb(29, 29, 29);
}
.h-menu > li:hover > a,
.h-menu > li:hover > a.dropdown-toggle::before {
  border-color: rgb(255, 255, 255);
  color: rgb(255, 255, 255);
}
.d-menu,
.v-menu {
  background-color: #e5e5e5 !important;
  color: rgb(29, 29, 29);
  border: 1px solid #e5e5e5;
  -webkit-box-shadow: none;
  box-shadow: none;
}
</style>

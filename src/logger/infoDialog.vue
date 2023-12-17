<template>
  <div id="infoDialog">
    <div class="dialog rounded">
      <div class="dialog-title">{{ title }}</div>
      <div class="dialog-content">
        <table class="table subcompact mt-4-minus" style="max-width: 100%">
          <tbody>
            <tr v-if="info.title">
              <td>Title:</td>
              <td class="infoText">
                {{ info.title }}
                <span
                  class="mif-copy"
                  style="cursor: pointer"
                  v-on:click="copyToClipboard(info.title)"
                ></span>
              </td>
            </tr>
            <tr v-if="info.header">
              <td>Header:</td>
              <td class="infoText">
                {{ info.header }}
                <span
                  class="mif-copy"
                  style="cursor: pointer"
                  v-on:click="copyToClipboard(info.header)"
                ></span>
              </td>
            </tr>
            <tr v-if="info.password">
              <td>Passwort:</td>
              <td class="infoText">
                {{ info.password }}
                <span
                  class="mif-copy"
                  style="cursor: pointer"
                  v-on:click="copyToClipboard(info.password)"
                ></span>
              </td>
            </tr>
            <tr v-if="info.category">
              <td>Kategorie:</td>
              <td class="infoText">
                {{ info.category }}
                <span
                  class="mif-copy"
                  style="cursor: pointer"
                  v-on:click="copyToClipboard(info.category)"
                ></span>
              </td>
            </tr>
            <tr v-if="info.source && info.engine == 'interception'">
              <td>NZB Herkunft:</td>
              <td class="infoText">
                Abgefangen auf
                <a :href="info.source" target="_blank"
                  >{{ info.source }}&nbsp;</a
                >
                <span
                  class="mif-copy"
                  style="cursor: pointer"
                  v-on:click="copyToClipboard(info.source)"
                ></span>
              </td>
            </tr>
            <tr v-if="info.engine && info.engine != 'interception'">
              <td>NZB Herkunft:</td>
              <td class="infoText">Geladen von {{ info.engine }}</td>
            </tr>
            <tr v-if="info.engine != 'interception'">
              <td>Ursprung:</td>
              <td class="infoText">
                <a :href="info.source" target="_blank"
                  >{{ info.source }}&nbsp;</a
                >
                <span
                  class="mif-copy"
                  style="cursor: pointer"
                  v-on:click="copyToClipboard(info.source)"
                ></span>
              </td>
            </tr>
            <tr v-if="info.target">
              <td>NZB-Datei Ziel:</td>
              <td class="infoText">{{ info.target }}</td>
            </tr>
            <tr v-if="info.filepath">
              <td>File Path:</td>
              <td class="infoText">
                {{ info.filepath }}
                <span
                  class="mif-copy"
                  style="cursor: pointer"
                  v-on:click="copyToClipboard(info.filepath)"
                ></span>
              </td>
            </tr>
            <tr v-if="info.date">
              <td>Datum:</td>
              <td class="infoText">{{ date(info.date) }}</td>
            </tr>
            <tr v-if="info.status">
              <td>Status:</td>
              <td class="infoText">{{ info.status }}</td>
            </tr>
            <tr v-if="info.error">
              <td>Fehlermeldung:</td>
              <td>{{ info.error }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="dialog-actions d-flex flex-justify-right">
        <button v-on:click="close" class="button secondary rounded">
          Schliessen
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { logDateFormat } from '../functions/functions.js';

export default {
  props: ['info'],
  data: function () {
    return {
      title: 'Details',
    };
  },
  created: async function () {},
  components: {},
  methods: {
    close: function () {
      this.$emit('close');
    },
    date: function (date) {
      return logDateFormat(new Date(date));
    },
    copyToClipboard: function (text) {
      const type = 'text/plain';
      const blob = new Blob([text], { type });
      // eslint-disable-next-line no-undef
      const data = [new ClipboardItem({ [type]: blob })];
      navigator.clipboard.write(data);
    },
  },
};
</script>

<style scoped>
#infoDialog {
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
#infoDialog .dialog {
  width: 600px !important;
  min-width: 600px !important;
  max-width: 600px !important;
  min-height: 150px !important;
  max-height: 400px !important;
}
#infoDialog .dialog-content {
  min-height: 150px;
  overflow-y: auto;
  overflow-x: clip;
}
td.infoText {
  max-width: 400px !important;
  overflow-wrap: break-word;
}
</style>

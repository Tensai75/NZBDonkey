<template>
  <div id="testEngineDialog">
    <div class="dialog rounded">
      <div class="dialog-title">{{ title }}</div>
      <div class="dialog-content">
        <div class="row mt-3-minus">
          <div class="cell-12">
            <inputs v-model="header" v-bind:settings="inputSettings"></inputs>
          </div>
        </div>
        <div class="row">
          <div class="cell text-right">
            <button
              v-on:click="testEngine"
              :disabled="testing || header == ''"
              class="button primary rounded"
            >
              Run Test
            </button>
          </div>
        </div>
        <div class="row mt-5 ml-0 mr-0 border rounded bd-cobalt">
          <div class="cell text-center">
            <span
              v-if="
                !searchUrl.testing && !searchUrl.success && !searchUrl.error
              "
              class="mif-pause"
            ></span>
            <span
              v-if="searchUrl.testing"
              class="mif-spinner2 ani-spin fg-cobalt"
            ></span>
            <span
              v-if="searchUrl.success"
              class="mif-checkmark fg-green mr-1 ml-1"
            ></span>
            <span
              v-if="searchUrl.error"
              class="mif-cancel fg-red mr-1 ml-1"
            ></span>
            <span class="mr-1 ml-1">Testing Search URL</span>
          </div>
        </div>
        <div class="row mt-5 ml-0 mr-0 border rounded bd-cobalt">
          <div class="cell text-center">
            <span
              v-if="!pattern.testing && !pattern.success && !pattern.error"
              class="mif-pause"
            ></span>
            <span
              v-if="pattern.testing"
              class="mif-spinner2 ani-spin fg-cobalt"
            ></span>
            <span
              v-if="pattern.success"
              class="mif-checkmark fg-green mr-1 ml-1"
            ></span>
            <span
              v-if="pattern.error"
              class="mif-cancel fg-red mr-1 ml-1"
            ></span>
            <span class="mr-1 ml-1">Testing Result Scraping</span>
          </div>
        </div>
        <div class="row ml-0 mr-0 mt-5 border rounded bd-cobalt">
          <div class="cell text-center">
            <span
              v-if="
                !nzbDownload.testing &&
                !nzbDownload.success &&
                !nzbDownload.error
              "
              class="mif-pause"
            ></span>
            <span
              v-if="nzbDownload.testing"
              class="mif-spinner2 ani-spin fg-cobalt"
            ></span>
            <span
              v-if="nzbDownload.success"
              class="mif-checkmark fg-green mr-1 ml-1"
            ></span>
            <span
              v-if="nzbDownload.error"
              class="mif-cancel fg-red mr-1 ml-1"
            ></span>
            <span class="mr-1 ml-1">Testing NZB Download URL</span>
          </div>
        </div>
        <div v-if="success" class="row mt-3">
          <div class="cell-12 text-center">
            <div class="mif-checkmark mif-2x fg-green"></div>
            <br />
            <div>{{ successInfo }}</div>
          </div>
        </div>
        <div v-if="error" class="row mt-3">
          <div class="cell-12 text-center">
            <div class="mif-cancel mif-2x fg-red"></div>
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
          v-on:click="next(template)"
          class="button success rounded"
          :disabled="!success"
        >
          Speichern
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import inputs from '../inputs/inputs.vue';
import functions from '../../../searchengines/functions.js';

export default {
  props: ['value', 'engine', 'template'],
  data: function () {
    return {
      inputSettings: {
        name: 'header',
        title: 'Test-Header',
        subtitle: '',
        caption: '',
        description: '',
        helptext:
          '<center>Als Test-Header muss ein Header verwendet werden,<br />welcher mit dieser Suchmaschine zu 100% ein Resultat liefert</center>',
        inputType: 'text',
        options: [],
        rules: {
          required: true,
        },
      },
      header: 'test',
      title: 'Verbindungstest',
      successInfo: 'Test erfolgreich!',
      searchUrl: {
        testing: false,
        error: false,
        success: false,
      },
      pattern: {
        testing: false,
        error: false,
        success: false,
      },
      nzbDownload: {
        testing: false,
        error: false,
        success: false,
      },
      testing: false,
      success: false,
      error: false,
    };
  },
  watch: {
    value: function (value) {
      this.success = value.toString();
    },
  },
  components: {
    inputs: inputs,
  },
  methods: {
    close: function () {
      this.$emit('close');
    },
    next: function () {
      this.$emit('next', this.template);
      this.$emit('close');
    },
    testEngine: async function () {
      this.reset();
      this.$emit('blur');
      this.testing = true;
      let result = await this.testSearchUrl();
      let nzbID = false;
      if (result) {
        nzbID = await this.testPattern(result);
      }
      let nzbFile = false;
      if (nzbID) {
        nzbFile = await this.testDownloadUrl(nzbID);
      }
      if (nzbFile) {
        this.success = true;
        this.$emit('input', true);
      } else {
        this.success = false;
        this.$emit('input', false);
      }
      this.testing = false;
    },
    testSearchUrl: async function () {
      try {
        this.searchUrl.testing = true;
        let result = await functions.search(this.header, this.engine);
        this.searchUrl.success = true;
        this.searchUrl.testing = false;
        return result;
      } catch (e) {
        this.error = 'Fehler bei der Verbindung!<br />' + e.message;
        this.searchUrl.error = true;
        this.searchUrl.testing = false;
        return false;
      }
    },
    testPattern: async function (result) {
      try {
        this.pattern.testing = true;
        let nzbID = await functions.checkresponse(result, this.engine);
        this.pattern.success = true;
        this.pattern.testing = false;
        return nzbID;
      } catch (e) {
        this.error = 'Fehler beim Auslesen!<br />' + e.message;
        this.pattern.error = true;
        this.pattern.testing = false;
        return false;
      }
    },
    testDownloadUrl: async function (nzbID) {
      try {
        this.nzbDownload.testing = true;
        let nzbFile = await functions.download(nzbID, this.engine);
        this.nzbDownload.success = true;
        this.nzbDownload.testing = false;
        return nzbFile;
      } catch (e) {
        this.error = 'Fehler bei der Verbindung!<br />' + e.message;
        this.nzbDownload.error = true;
        this.nzbDownload.testing = false;
        return false;
      }
    },
    reset: function () {
      this.searchUrl = {
        testing: false,
        error: false,
        success: false,
      };
      this.pattern = {
        testing: false,
        error: false,
        success: false,
      };
      this.nzbDownload = {
        testing: false,
        error: false,
        success: false,
      };
      this.testing = false;
      this.success = false;
      this.error = false;
    },
  },
};
</script>

<style scoped>
#testEngineDialog {
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

#testEngineDialog .dialog {
  width: 400px;
}

#testEngineDialog .dialog-content {
  min-height: 400px;
  overflow: auto;
}
</style>

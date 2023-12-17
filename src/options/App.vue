<template>
  <div
    v-if="settings"
    id="mainBody"
    class="h-100"
    data-role="navview"
    data-expand="fs"
    data-compact="false"
  >
    <loading-overlay v-if="!settings"></loading-overlay>
    <navigation v-model="activeTab" :tabs="tabs"></navigation>
    <div id="content" class="navview-content h-100">
      <div class="grid pl-5 flex_container flex_column">
        <div
          class="container border-bottom bd-black px-0 flex_min flex_column"
          style="height: 88px; white-space: nowrap"
        >
          <h2 class="mt-9 mb-0">{{ activeTabTitle }}</h2>
        </div>
        <contents v-model="inputValue" v-bind:activeTab="activeTab"></contents>
      </div>
    </div>
  </div>
</template>

<script>
import loadingOverlay from './components/loadingOverlay.vue';
import navigation from './components/navigation.vue';
import contents from './components/contents.vue';
import settings from '../settings/settings.js';

export default {
  name: 'App',
  data: function () {
    return {
      loaded: false,
      settings: window.NZBDONKEY_SETTINGS,
      activeTab: 'nzbtargets',
      activeTabTitle: 'NZB-Datei Ziele',
      tabs: [
        {
          name: 'Einstellungen',
          tabs: [
            { value: 'nzbtargets', name: 'NZB-Datei Ziele' },
            { value: 'searchengines', name: 'Suchmaschinen' },
            { value: 'interception', name: 'Download Überwachung' },
            {
              value: 'completeness',
              name: 'NZB-Datei Vollständigkeitsprüfung',
            },
            { value: 'processing', name: 'NZB-Datei Bearbeitung' },
            { value: 'general', name: 'Allgemein' },
          ],
        },
        {
          name: 'Informationen',
          tabs: [
            { value: 'logs', name: 'Logs' },
            { value: 'about', name: 'Über NZBDonkey' },
            { value: 'changelog', name: 'Änderungs-Historie' },
            { value: 'credits', name: 'Credits' },
          ],
        },
      ],
    };
  },
  computed: {
    inputValue: {
      get: function () {
        return { ...this.settings };
      },
      set: async function (value) {
        const result = JSON.parse(JSON.stringify(await value));
        settings.save(result);
      },
    },
  },
  created: function () {
    // set tab to the url hash
    if (window.location.hash) {
      let hash = window.location.hash.substring(1);
      if (
        this.tabs.find((tabs) => tabs.tabs.find((tab) => tab.value == hash))
      ) {
        this.activeTab = hash;
      }
    }
    document.addEventListener('click', function (event) {
      let elem = document.querySelector('.popover');
      if (elem) {
        elem.parentNode.removeChild(elem);
      }
    });
  },
  components: {
    loadingOverlay: loadingOverlay,
    navigation: navigation,
    contents: contents,
  },
  watch: {
    // watch settings changes
    inputValue: {
      handler: async function (value) {
        const result = JSON.parse(JSON.stringify(await value));
        settings.save(result);
      },
      deep: true,
    },
    // set the active tab title
    activeTab: function (activeTab) {
      this.activeTabTitle = this.tabs
        .find((tabs) => tabs.tabs.find((tab) => tab.value == activeTab))
        .tabs.find((tab) => tab.value == activeTab).name;
    },
  },
};
</script>

<style>
#mainBody {
  min-height: 100vh;
}
</style>

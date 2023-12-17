<template>
  <span>
    <table class="table subcompact" style="max-width: 100%">
      <thead style="border-bottom: 1px solid #e4e4e4">
        <tr>
          <th class="text-center" style="width: 1px">Status</th>
          <th>Title</th>
          <th class="text-center">Info</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in value" :key="index">
          <td class="text-center">
            <img width="32" height="32" :src="donkeyImg(item.status)" />
          </td>
          <td class="title">
            {{ item.title ? item.title : '' }}
          </td>
          <td class="text-center">
            <button
              v-on:click="infoDialog(item)"
              class="button small primary outline cycle"
            >
              <samp class="">i</samp>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <info-dialog
      v-if="showInfoDialog"
      v-on:close="showInfoDialog = false"
      :info="info"
    />
  </span>
</template>

<script>
import infoDialog from './infoDialog.vue';
import { logDateFormat } from '../functions/functions.js';

export default {
  props: ['value'],
  data: function () {
    return {
      title: 'NZB Log',
      info: false,
      showInfoDialog: false,
    };
  },
  created: async function () {},
  methods: {
    date: function (date) {
      return logDateFormat(new Date(date));
    },
    donkeyImg: function (status) {
      if (status == 'success')
        return browser.runtime.getURL('icons/NZBDonkey_success_128.png');
      else if (status == 'error')
        return browser.runtime.getURL('icons/NZBDonkey_error_128.png');
      else return 'icons/NZBDonkey_128.png';
    },
    infoDialog: function (info) {
      this.info = info;
      this.showInfoDialog = true;
    },
    close: function () {
      this.showInfoDialog = false;
    },
  },
  components: {
    infoDialog: infoDialog,
  },
};
</script>

<style scoped>
table {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
}

td {
  max-width: 300px !important;
  overflow-wrap: break-word;
}
td.title {
  max-width: 400px !important;
  overflow-wrap: break-word;
}
</style>

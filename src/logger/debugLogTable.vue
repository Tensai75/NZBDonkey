<template>
  <table class="table subcompact">
    <thead style="border-bottom: 1px solid #e4e4e4">
      <tr>
        <th style="width: 1px">Date</th>
        <th style="width: 1px">Type</th>
        <th>Text</th>
        <th>Source</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, index) in value"
        :key="index"
        :class="[item.type == 'warn' || item.type == 'error' ? item.type : '']"
      >
        <td class="date">
          {{ date(item.date) }}
        </td>
        <td class="text-center">
          <div v-if="item.type == 'info'" class="mif-info fg-green"></div>
          <div
            v-if="item.type == 'warn'"
            class="mif-warning fg-darkOrange"
          ></div>
          <div v-if="item.type == 'error'" class="mif-cancel fg-darkRed"></div>
        </td>
        <td>
          {{ item.text }}
        </td>
        <td>
          {{ item.source }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import { logDateFormat } from '../functions/functions.js';

export default {
  props: ['value'],
  data: function () {
    return {
      title: 'Debug Log',
    };
  },
  created: async function () {},
  methods: {
    date: function (date) {
      return logDateFormat(new Date(date));
    },
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
td.date {
  white-space: nowrap;
}
</style>

<template>
  <div id="contents" class="container pt-4 flex_max scroll flex_column">
    <nzbtargets
      v-if="activeTab == 'nzbtargets'"
      v-model="settings"
    ></nzbtargets>
    <searchengines
      v-if="activeTab == 'searchengines'"
      v-model="settings"
    ></searchengines>
    <interception
      v-if="activeTab == 'interception'"
      v-model="settings"
    ></interception>
    <processing
      v-if="activeTab == 'processing'"
      v-model="settings"
    ></processing>
    <completeness
      v-if="activeTab == 'completeness'"
      v-model="settings"
    ></completeness>
    <general v-if="activeTab == 'general'" v-model="settings"></general>
    <logs v-if="activeTab == 'logs'" v-model="settings"></logs>
  </div>
</template>

<script>
import nzbtargets from './nzbtargets/nzbtargets.vue';
import searchengines from './searchengines/searchengines.vue';
import interception from './interception/interception.vue';
import completeness from './completeness/completeness.vue';
import processing from './processing/processing.vue';
import general from './general/general.vue';
import logs from './logs.vue';

export default {
  props: ['value', 'activeTab'],
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
  components: {
    nzbtargets: nzbtargets,
    searchengines: searchengines,
    completeness: completeness,
    processing: processing,
    general: general,
    interception: interception,
    logs: logs,
  },
};
</script>

<style>
#contents {
  height: calc(100vh - 89px);
  min-height: calc(100vh - 89px);
}
</style>

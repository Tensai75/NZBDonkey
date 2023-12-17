<template>
  <div class="navview-pane">
    <div class="w-100 p-5 text-right">
      <img src="/icons/NZBDonkey_48.png" />
    </div>
    <ul id="navigationmenu" class="navview-menu text-right">
      <template v-for="(tab, index) in tabs">
        <li class="item-separator" v-bind:key="'seperator' + index"></li>
        <li class="item-header px-5" v-bind:key="'name' + index">
          {{ tab.name }}
        </li>
        <li
          v-for="(menu, menuIndex) in tab.tabs"
          class="text-right"
          v-bind:key="'menuli-' + index + '-' + menuIndex"
        >
          <a
            v-bind:key="'menua-' + index + '-' + menuIndex"
            v-on:click="$emit('click', menu.value)"
            v-bind:class="[
              'px-5',
              'text-right',
              activeTab === menu.value ? 'active' : '',
            ]"
            v-bind:href="['#' + menu.value]"
          >
            <span class="caption px-0 w-100">{{ menu.name }}</span>
          </a>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
export default {
  props: ['activeTab', 'tabs'],
  model: {
    prop: 'activeTab',
    event: 'click',
  },
};
</script>

<style></style>

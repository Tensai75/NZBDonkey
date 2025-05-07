<script setup lang="ts">
import { browser } from '#imports'

let CHANGELOG: string

const language = browser.i18n.getUILanguage().slice(0, 2).toUpperCase()
switch (language) {
  /*
  case 'DE':
    CHANGELOG = (await import('@@/CHANGELOG.DE.md?raw')).default
    break
    */
  default:
    CHANGELOG = (await import('@@/CHANGELOG.md')).default
}
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="text-sm license" v-html="CHANGELOG"></div>
</template>

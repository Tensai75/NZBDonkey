<script setup lang="ts">
import { browser } from '#imports'

let LICENSE: string

const language = browser.i18n.getUILanguage().slice(0, 2).toUpperCase()
switch (language) {
  case 'DE':
    LICENSE = (await import('@@/LICENSE.DE.md')).default
    break
  default:
    LICENSE = (await import('@@/LICENSE.md')).default
}
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="text-sm license" v-html="LICENSE"></div>
</template>

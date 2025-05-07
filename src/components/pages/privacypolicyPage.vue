<script setup lang="ts">
import { browser } from '#imports'

let PRIVACYPOLICY: string

const language = browser.i18n.getUILanguage().slice(0, 2).toUpperCase()
switch (language) {
  case 'DE':
    PRIVACYPOLICY = (await import('@@/PRIVACYPOLICY.DE.md')).default
    break
  default:
    PRIVACYPOLICY = (await import('@@/PRIVACYPOLICY.md')).default
}
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="text-sm license" v-html="PRIVACYPOLICY"></div>
</template>

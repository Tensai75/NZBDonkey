<script lang="ts" setup>
import { version } from '@@/package.json'
import { Button } from 'primevue'

import { i18n } from '#i18n'
import { browser } from '#imports'
import NZBDonkeyLogo from '@/components/nzbdonkeyLogo.vue'

const hash = window.location.hash

document.title = i18n.t('extension.name')
</script>

<template>
  <div class="flex flex-col w-full h-screen justify-center items-center">
    <div class="flex flex-row justify-center w-full mb-16">
      <NZBDonkeyLogo size="48" />
      <h1 class="text-5xl ml-4 text-center">
        {{ i18n.t('extension.name') }} <span class="text-xl">v{{ version }}</span>
      </h1>
    </div>
    <h1 v-if="hash !== ''" class="text-4xl font-bold mb-4 text-center">
      {{ i18n.t('common.caution').toLocaleUpperCase() }}
    </h1>
    <div v-if="hash.startsWith('#INSTALLED')">
      <h2 class="text-2xl mb-4 text-center">{{ i18n.t('common.extensionMustBeConfiguredFirst') }}</h2>
    </div>
    <div v-if="hash.startsWith('#NOACTIVE')">
      <h2 v-if="hash == '#NOACTIVETARGET'" class="text-3xl font-bold text-red-600 mb-8 text-center">
        {{ i18n.t('common.error') }}: {{ i18n.t('errors.noActiveTargets') }}!
      </h2>
      <h2 v-if="hash == '#NOACTIVEENGINE'" class="text-3xl font-bold text-red-600 mb-8 text-center">
        {{ i18n.t('common.error') }}: {{ i18n.t('errors.noActiveSearchEngines') }}!
      </h2>
      <h2 class="text-2xl mb-4 text-center">{{ i18n.t('common.extensionMustBeConfiguredFirst') }}</h2>
    </div>
    <div v-if="hash.startsWith('#UPDATED')">
      <h2 class="text-3xl font-bold mb-8 text-center" style="max-width: 1000px">
        {{ i18n.t('common.extensionWasUpdated') }}.
      </h2>
      <h2
        v-if="hash === '#UPDATED_FROM_V0_7_7'"
        class="text-3xl font-bold text-yellow-600 mb-8 text-center"
        style="max-width: 1000px"
      >
        {{ i18n.t('errors.settingsWereNotPreserved') }}!
      </h2>
      <h2
        v-if="hash === '#UPDATED_WITH_ERROR'"
        class="text-3xl font-bold text-red-600 mb-8 text-center"
        style="max-width: 1000px"
      >
        {{ i18n.t('common.error') }}: {{ i18n.t('errors.settingsMigrationError') }}!
      </h2>
      <h2 class="text-2xl mb-8 text-center" style="max-width: 1000px">{{ i18n.t('common.checkSettings') }}!</h2>
    </div>
    <Button
      :label="i18n.t('common.openSettings')"
      icon="pi pi-cog"
      class="mt-16 p-button-raised p-8"
      :class="hash.startsWith('#NOACTIVE') || hash === '#UPDATED_WITH_ERROR' ? 'p-button-danger' : 'p-button-secondary'"
      style="padding: 25px; font-size: 1.5rem"
      @click="browser.runtime.openOptionsPage()"
    />
  </div>
</template>

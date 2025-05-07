<script setup lang="ts">
import { version } from '@@/package.json'
import { ConfirmDialog } from 'primevue'
import { ref } from 'vue'

import { i18n } from '#i18n'
import GeneralSettings from '@/components/generalSettings.vue'
import InterceptionSettings from '@/components/interception/interceptionSettings.vue'
import NZBDonkeyLogo from '@/components/nzbdonkeyLogo.vue'
import NzbfileSettings from '@/components/nzbfileSettings.vue'
import ChangelogPage from '@/components/pages/changelogPage.vue'
import CreditsPage from '@/components/pages/creditsPage.vue'
import LicensePage from '@/components/pages/licensePage.vue'
import PrivacypolicyPage from '@/components/pages/privacypolicyPage.vue'
import EnginesSettings from '@/components/searchengines/searchenginesSettings.vue'
import TargetsSettings from '@/components/targets/targetsSettings.vue'

type Settings = 'targets' | 'general' | 'nzbfile' | 'engines' | 'interception'

const settings: { id: Settings; name: string }[] = [
  { id: 'targets', name: i18n.t('menu.settings.nzbFileTargets') },
  { id: 'engines', name: i18n.t('menu.settings.searchEngines') },
  { id: 'interception', name: i18n.t('menu.settings.interception') },
  { id: 'nzbfile', name: i18n.t('menu.settings.nzbFile') },
  { id: 'general', name: i18n.t('menu.settings.general') },
]

const about: { id: string; name: string }[] = [
  { id: 'license', name: i18n.t('menu.license') },
  { id: 'privacypolicy', name: i18n.t('menu.privacyPolicy') },
  { id: 'changelog', name: i18n.t('menu.changelog') },
  { id: 'credits', name: i18n.t('menu.credits') },
]

const menuItem = ref('targets')
</script>

<template>
  <div class="flex flex-row w-full h-screen">
    <!-- Left Column -->
    <div class="flex flex-col max-w-[320px] w-full mr-8">
      <!-- Top Left -->
      <div class="w-[320px] h-[100px] p-4 pr-0 flex justify-end border-2 border-transparent border-b-primary-500">
        <NZBDonkeyLogo size="48" />
      </div>
      <!-- Middle Left (Scrollable) -->
      <div class="h-full p-4 pr-0 flex flex-col text-right overflow-y-auto scroll-left">
        <h1 class="secondary">{{ i18n.t('menu.settings.title') }}</h1>
        <div
          v-for="setting in settings"
          :key="setting.id"
          :class="
            'w-[80%] mt-2 p-2 pr-0 text-base border-2 border-transparent hover:border-b-primary-500 cursor-pointer' +
            (menuItem === setting.id ? ' border-b-primary-500' : '')
          "
          @click="menuItem = setting.id"
        >
          {{ setting.name }}
        </div>
        <h1 class="secondary mt-16">{{ i18n.t('menu.about') }}</h1>
        <div
          v-for="item in about"
          :key="item.id"
          :class="
            'w-[80%] mt-2 p-2 pr-0 text-base border-2 border-transparent hover:border-b-primary-500 cursor-pointer' +
            (menuItem === item.id ? ' border-b-primary-500' : '')
          "
          @click="menuItem = item.id"
        >
          {{ item.name }}
        </div>
      </div>
      <!-- Bottom Left -->
      <div class="w-[320px] h-16 p-4 pr-0 text-right">{{ i18n.t('extension.name') }} v{{ version }}</div>
    </div>

    <!-- Right Column -->
    <div class="flex flex-col flex-1 w-full ml-8">
      <!-- Top Right -->
      <div class="w-full h-[100px] p-4 pl-0 content-end border-2 border-transparent border-b-primary-500">
        <span v-if="settings.find((item) => item.id === menuItem)" class="text-3xl">{{
          i18n.t('menu.settings.title')
        }}</span>
        <span v-if="menuItem === 'license'" class="text-3xl">{{ i18n.t('menu.license') }}</span>
        <span v-if="menuItem === 'privacypolicy'" class="text-3xl">{{ i18n.t('menu.privacyPolicy') }}</span>
        <span v-if="menuItem === 'changelog'" class="text-3xl">{{ i18n.t('menu.changelog') }}</span>
        <span v-if="menuItem === 'credits'" class="text-3xl">{{ i18n.t('menu.credits') }}</span>
      </div>
      <!-- Middle Right (Scrollable) -->
      <div class="h-full p-4 pl-0 overflow-y-auto">
        <Suspense v-if="menuItem === 'targets'"><TargetsSettings /></Suspense>
        <Suspense v-if="menuItem === 'general'"><GeneralSettings /></Suspense>
        <Suspense v-if="menuItem === 'nzbfile'"><NzbfileSettings /></Suspense>
        <Suspense v-if="menuItem === 'engines'"><EnginesSettings /></Suspense>
        <Suspense v-if="menuItem === 'interception'"><InterceptionSettings /></Suspense>
        <Suspense v-if="menuItem === 'license'"><LicensePage /></Suspense>
        <Suspense v-if="menuItem === 'privacypolicy'"><PrivacypolicyPage /></Suspense>
        <Suspense v-if="menuItem === 'changelog'"><ChangelogPage /></Suspense>
        <template v-if="menuItem === 'credits'"><CreditsPage /></template>
      </div>
      <!-- Bottom Right -->
      <div class="h-16 p-4 pl-0 w-full">Copyright &copy; {{ new Date().getFullYear() }} by Tensai</div>
    </div>
  </div>
  <ConfirmDialog />
</template>
<style lang="css" scoped>
.scroll-left {
  direction: rtl; /* This moves the scrollbar to the left */
}
.scroll-left > * {
  direction: ltr; /* Ensures content is still left-to-right */
}
</style>

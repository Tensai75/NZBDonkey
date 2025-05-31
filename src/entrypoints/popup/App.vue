<script lang="ts" setup>
import { Button, ConfirmDialog, Menu } from 'primevue'
import { onMounted, ref } from 'vue'

import { i18n } from '#i18n'
import { browser } from '#imports'
import GeneralSettings from '@/components/generalSettings.vue'
import InterceptionSettings from '@/components/interception/interceptionSettings.vue'
import DebugLog from '@/components/logger/debugLog.vue'
import NZBLog from '@/components/logger/nzbLog.vue'
import NZBDonkeyLogo from '@/components/nzbdonkeyLogo.vue'
import NzbFileSettings from '@/components/nzbfileSettings.vue'
import SearchEngineSettings from '@/components/searchengines/searchenginesSettings.vue'
import TargetSettings from '@/components/targets/targetsSettings.vue'

const selectedMenuItem = ref<
  | 'nzblog'
  | 'debuglog'
  | 'targetsSettings'
  | 'searchEnginesSettings'
  | 'interceptionSettings'
  | 'nzbfileSettings'
  | 'generalSettings'
>('nzblog')
const showMenu = ref(false)
const menuContainer = ref()
const menuButtonContainer = ref()
const menu = ref()
const items = ref([
  {
    label: i18n.t('menu.logger.title'),
    items: [
      {
        label: i18n.t('menu.logger.nzbLog.title'),
        icon: 'pi pi-book',
        command: () => {
          showMenu.value = false
          selectedMenuItem.value = 'nzblog'
        },
      },
      {
        label: i18n.t('menu.logger.debugLog.title'),
        icon: 'pi pi-book',
        command: () => {
          showMenu.value = false
          selectedMenuItem.value = 'debuglog'
        },
      },
    ],
  },
  {
    label: i18n.t('menu.settings.title'),
    items: [
      {
        label: i18n.t('menu.settings.nzbFileTargets'),
        icon: 'pi pi-cog',
        command: () => {
          showMenu.value = false
          selectedMenuItem.value = 'targetsSettings'
        },
      },
      {
        label: i18n.t('menu.settings.searchEngines'),
        icon: 'pi pi-cog',
        command: () => {
          showMenu.value = false
          selectedMenuItem.value = 'searchEnginesSettings'
        },
      },
      {
        label: i18n.t('menu.settings.interception'),
        icon: 'pi pi-cog',
        command: () => {
          showMenu.value = false
          selectedMenuItem.value = 'interceptionSettings'
        },
      },
      {
        label: i18n.t('menu.settings.nzbFile'),
        icon: 'pi pi-cog',
        command: () => {
          showMenu.value = false
          selectedMenuItem.value = 'nzbfileSettings'
        },
      },
      {
        label: i18n.t('menu.settings.general'),
        icon: 'pi pi-cog',
        command: () => {
          showMenu.value = false
          selectedMenuItem.value = 'generalSettings'
        },
      },
    ],
  },
])

const close = () => {
  window.close()
}

const openSettings = () => {
  browser.runtime.openOptionsPage()
  window.close()
}

onMounted(() => {
  browser.permissions.contains({ origins: ['<all_urls>'] }).then((result) => {
    if (!result) {
      browser.runtime.openOptionsPage()
      window.close()
    }
  })
  document.addEventListener('click', (e) => {
    if (
      e.target === menuContainer.value ||
      e.composedPath().includes(menuContainer.value) ||
      e.target === menuButtonContainer.value ||
      e.composedPath().includes(menuButtonContainer.value)
    ) {
      return
    }
    showMenu.value = false
  })
})
</script>

<template>
  <div class="flex flex-col" style="height: 600px; width: 800px">
    <!-- Header -->
    <header class="flex p-4 w-full">
      <div class="flex flex-row justify-between w-full">
        <div class="inline-flex items-center justify-center gap-2">
          <NZBDonkeyLogo size="32" />
          <span class="font-bold whitespace-nowrap text-lg">{{ i18n.t('extension.name') }}</span>
          <span v-if="selectedMenuItem === 'nzblog'" class="font-bold whitespace-nowrap text-lg">
            {{ ` -  ${i18n.t('menu.logger.nzbLog.title')}` }}
          </span>
          <span v-if="selectedMenuItem === 'debuglog'" class="font-bold whitespace-nowrap text-lg">
            {{ ` -  ${i18n.t('menu.logger.debugLog.title')}` }}
          </span>
          <span v-if="selectedMenuItem === 'generalSettings'" class="font-bold whitespace-nowrap text-lg">
            {{ ` -  ${i18n.t('menu.settings.title')}: ${i18n.t('menu.settings.general')}` }}
          </span>
          <span v-if="selectedMenuItem === 'nzbfileSettings'" class="font-bold whitespace-nowrap text-lg">
            {{ ` -  ${i18n.t('menu.settings.title')}: ${i18n.t('menu.settings.nzbFile')}` }}
          </span>
          <span v-if="selectedMenuItem === 'targetsSettings'" class="font-bold whitespace-nowrap text-lg">
            {{ ` -  ${i18n.t('menu.settings.title')}: ${i18n.t('menu.settings.nzbFileTargets')}` }}
          </span>
          <span v-if="selectedMenuItem === 'searchEnginesSettings'" class="font-bold whitespace-nowrap text-lg">
            {{ ` -  ${i18n.t('menu.settings.title')}: ${i18n.t('menu.settings.searchEngines')}` }}
          </span>
          <span v-if="selectedMenuItem === 'interceptionSettings'" class="font-bold whitespace-nowrap text-lg">
            {{ ` -  ${i18n.t('menu.settings.title')}: ${i18n.t('menu.settings.interception')}` }}
          </span>
        </div>
        <div class="card flex justify-center">
          <div ref="menuButtonContainer">
            <Button
              type="button"
              icon="pi pi-ellipsis-v"
              aria-haspopup="true"
              aria-controls="overlay_menu"
              size="small"
              severity="secondary"
              @click="showMenu = !showMenu"
            />
          </div>
          <div v-if="showMenu" ref="menuContainer" style="position: absolute; z-index: 9999; top: 55px; right: 16px">
            <Menu id="menu" ref="menu" :model="items" :popup="false" />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto px-4 w-full">
      <div class="space-y-4 h-full">
        <NZBLog v-if="selectedMenuItem === 'nzblog'" />
        <DebugLog v-if="selectedMenuItem === 'debuglog'" />
        <Suspense><GeneralSettings v-if="selectedMenuItem === 'generalSettings'" /></Suspense>
        <Suspense><NzbFileSettings v-if="selectedMenuItem === 'nzbfileSettings'" /></Suspense>
        <Suspense><TargetSettings v-if="selectedMenuItem === 'targetsSettings'" /></Suspense>
        <Suspense><SearchEngineSettings v-if="selectedMenuItem === 'searchEnginesSettings'" /></Suspense>
        <Suspense><InterceptionSettings v-if="selectedMenuItem === 'interceptionSettings'" /></Suspense>
      </div>
    </main>

    <!-- Footer -->
    <footer class="flex w-full p-4">
      <div class="flex flex-row justify-between w-full">
        <Button
          :label="i18n.t('common.openSettings')"
          icon="pi pi-cog"
          severity="secondary"
          @click="openSettings()"
        ></Button>
        <Button :label="i18n.t('common.close')" @click="close()"></Button>
      </div>
    </footer>
  </div>
  <ConfirmDialog></ConfirmDialog>
</template>

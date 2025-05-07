<script lang="ts" setup>
import { Button, ProgressSpinner } from 'primevue'
import { nextTick, ref, Ref, watch } from 'vue'

import { i18n } from '#i18n'
import { browser, Browser } from '#imports'
import { CategorySettings } from '@/services/categories'
import log from '@/services/logger/debugLogger'
import { focusPopupWindow, resizePopupWindow } from '@/utils/popupWindowUtilities'

const loaded = ref(false)
let port: Browser.runtime.Port | undefined = undefined
const categories = ref([]) as Ref<CategorySettings[]>
const title = ref('')

document.title = i18n.t('extension.name')

browser.windows.getCurrent().then((window) => {
  port = browser.runtime.connect({ name: 'categorySelection_' + window.id })
  port.onMessage.addListener((message: unknown) => {
    if (message !== null && typeof message === 'object' && 'categories' in message && 'title' in message) {
      const typedMessage = message as { categories: CategorySettings[]; title: string }
      categories.value = typedMessage.categories.filter((category) => category.active)
      title.value = typedMessage.title
      loaded.value = true
    } else {
      log.error('received invalid message')
    }
  })
})

function cancel() {
  if (port) {
    port.postMessage(null)
  } else {
    browser.windows.getCurrent().then((window) => {
      browser.windows.remove(window.id as number)
    })
  }
}

function submit(category: string) {
  if (port) port.postMessage(category)
}

watch(loaded, () => {
  nextTick(() => {
    resizePopupWindow('main > *', 640, 800)
  })
  focusPopupWindow(5000)
})
</script>

<template>
  <div v-if="!loaded" class="flex items-center justify-center flex-grow" style="height: 100vh">
    <ProgressSpinner style="width: 60px; height: 60px" stroke-width="3" />
  </div>
  <div v-if="loaded" class="flex flex-col h-screen w-full">
    <!-- Header -->
    <header class="flex p-4 flex-shrink">
      <div class="flex flex-row justify-between w-full">
        <div class="inline-flex items-center justify-center gap-2">
          <span class="font-bold whitespace-nowrap text-lg">{{ title }}</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex overflow-y-auto flex-col space-y-2 px-4 h-full">
      <div>
        <Button
          :label="i18n.t('common.noCategory')"
          severity="primary"
          raised
          variant="outlined"
          class="w-full"
          @click="submit('')"
        ></Button>
      </div>
      <div v-for="category in categories" :key="category.name">
        <Button
          :label="category.name"
          severity="primary"
          raised
          variant="outlined"
          class="w-full"
          @click="submit(category.name)"
        ></Button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="flex flex-shrink p-4">
      <div class="flex flex-row justify-end w-full">
        <Button :label="i18n.t('common.cancel')" severity="secondary" @click="cancel()"></Button>
      </div>
    </footer>
  </div>
</template>

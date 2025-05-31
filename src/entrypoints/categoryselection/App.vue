<script lang="ts" setup>
import { Button, ProgressSpinner } from 'primevue'
import { nextTick, ref, Ref, watch } from 'vue'

import { i18n } from '#i18n'
import { browser, Browser } from '#imports'
import { CategorySettings } from '@/services/categories'
import log from '@/services/logger/debugLogger'
import { focusPopupWindow, resizePopupWindow } from '@/utils/popupWindowUtilities'

const overlay = ref(true)
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
  nextTick(async () => {
    await resize()
    overlay.value = false
    focusPopupWindow(5000)
  })
})

function resize() {
  return new Promise<void>((resolve) => {
    setTimeout(async () => {
      const maxHeight = 800 > screen.availHeight ? screen.availHeight : 800
      const headerHeight = document.querySelector('header')?.scrollHeight || 0
      const footerHeight = document.querySelector('footer')?.scrollHeight || 0
      const availableHeight = maxHeight - headerHeight - footerHeight
      const content = document.getElementById('content')
      const contentHeight = content?.scrollHeight || 0
      const maxContentHeight = contentHeight > availableHeight ? availableHeight : contentHeight
      if (content) {
        content.style.maxHeight = `${maxContentHeight}px`
        content.style.height = `${maxContentHeight}px`
      }
      await resizePopupWindow(640, headerHeight + maxContentHeight + footerHeight)
      resolve()
    }, 100)
  })
}
</script>

<template>
  <div v-if="overlay" class="overlay">
    <ProgressSpinner style="width: 60px; height: 60px" stroke-width="3" />
  </div>
  <div v-if="loaded" class="flex flex-col h-screen w-full">
    <!-- Header -->
    <header id="header" class="flex p-4 flex-shrink">
      <div class="flex flex-row justify-between w-full">
        <div class="inline-flex items-center justify-center gap-2">
          <span class="font-bold whitespace-nowrap text-lg">{{ title }}</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main id="content" class="flex overflow-y-auto flex-col space-y-2 px-4 h-full">
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
    </main>

    <!-- Footer -->
    <footer id="footer" class="flex flex-shrink p-4">
      <div class="flex flex-row justify-end w-full">
        <Button :label="i18n.t('common.cancel')" severity="secondary" @click="cancel()"></Button>
      </div>
    </footer>
  </div>
</template>
<style lang="css">
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black; /* Solid black background */
  z-index: 1000; /* Ensure it appears above other elements */
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

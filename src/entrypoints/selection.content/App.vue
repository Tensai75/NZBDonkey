<script lang="ts" setup>
import { Form, FormField } from '@primevue/forms'
import { Button, Dialog, InputText, Message, Textarea } from 'primevue'
import { nextTick, onMounted, ref } from 'vue'
import { PublicPath } from 'wxt/browser'

import { i18n } from '#i18n'
import { browser } from '#imports'
import NZBDonkeyLogo from '@/components/nzbdonkeyLogo.vue'
import { Settings as GeneralSettings, analyseText } from '@/services/general'
import log from '@/services/logger/debugLogger'
import { onMessage, sendMessage } from '@/services/messengers/extensionMessenger'
import { requiredResolver } from '@/services/resolvers'

log.info('analyseSelection script successfully loaded')
const rerenderKey = ref(0)
const parameters = ref<{
  selection: string
  header: string
  password: string
  title: string
}>({
  selection: '',
  header: '',
  password: '',
  title: '',
})
const visible = ref(true)
const generalSettings = ref<GeneralSettings>()

onMessage('analyseTextSelection', (message) => {
  if (message.data.tabId === window.__TAB_ID__) {
    if (generalSettings.value) parameters.value = analyseText(generalSettings.value)
    visible.value = true
  }
})

// fix for tailwind rem based sizeing
const html = document.querySelector('html')
const fontSize = html ? html.style.fontSize : ''
if (html) html.style.fontSize = '16px'

const shadowRoot = document.querySelector('nzbdonkey-selection-dialog') as HTMLElement
const shadowRootHead = shadowRoot.shadowRoot?.querySelector('head') as HTMLElement
const shadowRootBody = shadowRoot.shadowRoot?.querySelector('body') as HTMLElement
onMounted(() => {
  sendMessage('getGeneralSettings', true)
    .then(async (settings) => {
      await nextTick()
      loadStyles()
      movePrimeVueStyles()
      generalSettings.value = await settings
      parameters.value = analyseText(generalSettings.value)
      rerenderKey.value++
    })
    .catch((e: Error) => {
      log.error('error while sending analyseSelection command from background script', e)
    })
})

function loadStyles() {
  // load styles
  const url = browser.runtime.getURL('/assets/style.css' as PublicPath)
  const link = document.createElement('link')
  link.href = url
  link.type = 'text/css'
  link.rel = 'stylesheet'
  shadowRootHead.append(link)
}

function movePrimeVueStyles() {
  // fix for primevue mounting styles in document head instead in shadow dom head
  const primeStyles = document.querySelectorAll('head > style[type="text/css"][data-primevue-style-id]')
  primeStyles.forEach((node) => {
    if (
      !node.getAttribute('data-primevue-style-id')?.includes('variables') ||
      node.getAttribute('data-primevue-style-id')?.includes('global')
    ) {
      const clonedNode = node.cloneNode(true) as HTMLStyleElement
      shadowRootHead.append(clonedNode)
      node.remove()
    }
  })
}

function close() {
  visible.value = false
  if (html) html.style.removeProperty('font-size')
  if (html && fontSize != '') html.style.fontSize = fontSize
}

function processNzblnk() {
  close()
  sendMessage('searchNzbFile', {
    nzblnk: `nzblnk://?h=${encodeURI(parameters.value.header)}&t=${encodeURI(parameters.value.title)}&p=${encodeURI(
      parameters.value.password
    )}`,
    source: document.URL,
  })
}
</script>

<template>
  <Form
    :key="rerenderKey"
    v-slot="$form"
    :validate-on-change="true"
    :validate-on-blur="true"
    :validate-on-value-update="true"
    :validate-on-mount="true"
  >
    <Dialog
      v-model:visible="visible"
      :closable="false"
      modal
      :append-to="shadowRootBody"
      header="NZBDonkey"
      style="width: 48rem; max-width: 48rem; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    >
      <template #header>
        <div class="inline-flex items-center justify-center gap-2">
          <NZBDonkeyLogo size="32" />
          <span class="font-bold whitespace-nowrap text-lg">{{ i18n.t('extension.name') }}</span>
        </div>
      </template>
      <div class="flex flex-row items-center gap-4 mb-4 flex-auto">
        <label for="header" class="font-semibold w-32 text-right">{{ i18n.t('common.header') }}</label>
        <FormField
          v-slot="$field"
          :name="i18n.t('common.header')"
          :initial-value="parameters.header"
          :resolver="requiredResolver"
          class="inline grid-row flex-auto"
        >
          <InputText
            id="header"
            v-model="parameters.header as string"
            class="w-full"
            size="small"
            autocomplete="off"
            type="text"
          />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
            $field.error?.message
          }}</Message>
        </FormField>
      </div>
      <div class="flex flex-row items-center gap-4 mb-4 flex-auto">
        <label for="title" class="font-semibold w-32 text-right">{{ i18n.t('common.title') }}</label>
        <InputText
          id="title"
          v-model="parameters.title as string"
          class="flex-auto"
          size="small"
          autocomplete="off"
          type="text"
        />
      </div>
      <div class="flex flex-row items-center gap-4 mb-4 flex-auto">
        <label for="password" class="font-semibold w-32 text-right">{{ i18n.t('common.password') }}</label>
        <InputText
          id="password"
          v-model="parameters.password as string"
          class="flex-auto"
          size="small"
          autocomplete="off"
          type="text"
        />
      </div>
      <div class="flex items-center gap-4 mb-4 flex-auto">
        <label for="selection" class="font-semibold w-32 text-right">{{ i18n.t('common.selection') }}</label>
        <Textarea
          id="selection"
          v-model="parameters.selection as string"
          rows="5"
          class="flex-auto"
          style="resize: none; font-size: 0.9rem"
        />
      </div>
      <template #footer>
        <div class="flex justify-between w-full gap-4 testClass">
          <div></div>
          <div class="flex justify-end gap-4">
            <Button type="button" :label="i18n.t('common.cancel')" severity="secondary" @click="close()"></Button>
            <Button
              type="button"
              :label="i18n.t('nzbsearch.searchNzb')"
              :disabled="!$form.valid"
              @click="processNzblnk()"
            ></Button>
          </div>
        </div>
      </template>
    </Dialog>
  </Form>
</template>

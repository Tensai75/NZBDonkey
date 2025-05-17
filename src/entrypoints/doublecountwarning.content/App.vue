<script lang="ts" setup>
import { FormField } from '@primevue/forms'
import { Button, Dialog, ToggleSwitch } from 'primevue'
import { nextTick, onMounted, ref, toRaw } from 'vue'
import { PublicPath } from 'wxt/browser'

import { i18n } from '#i18n'
import { browser } from '#imports'
import NZBDonkeyLogo from '@/components/nzbdonkeyLogo.vue'
import { DomainSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import { onMessage, sendMessage } from '@/services/messengers/extensionMessenger'

log.info('analyseSelection script successfully loaded')
const domain = ref<DomainSettings>({} as DomainSettings)
const domainSettings = ref<DomainSettings>({} as DomainSettings)
const visible = ref(true)

function submit() {
  close()
  sendMessage('doubleCountWarningResponse', {
    domain: toRaw(domain.value),
  })
}

onMessage('doubleCountWarning', (message) => {
  if (message.data.tabId === window.__TAB_ID__) {
    if (message.data.domain) {
      domain.value = JSON.parse(JSON.stringify(message.data.domain)) as DomainSettings
      domainSettings.value = message.data.domain
    }
    visible.value = true
  }
})

// fix for tailwind rem based sizeing
const html = document.querySelector('html')
const fontSize = html ? html.style.fontSize : ''
if (html) html.style.fontSize = '16px'

const shadowRoot = document.querySelector('nzbdonkey-doublecountwarning-dialog') as HTMLElement
const shadowRootHead = shadowRoot.shadowRoot?.querySelector('head') as HTMLElement
const shadowRootBody = shadowRoot.shadowRoot?.querySelector('body') as HTMLElement
onMounted(async () => {
  await nextTick()
  loadStyles()
  movePrimeVueStyles()
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
</script>

<template>
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
        <NZBDonkeyLogo size="32" color="#FFA726" />
        <span class="font-bold whitespace-nowrap text-2xl">{{ i18n.t('common.caution') }}</span>
      </div>
    </template>
    <div class="gap-4 mb-4">
      <div v-if="!domainSettings.allowDownloadInterception" class="mb-8">
        <h2>
          {{ i18n.t('interception.doubleCountDownloadInformation', [domain.domain]) }}
        </h2>
      </div>
      <div v-if="domainSettings.allowDownloadInterception" class="mb-8">
        <h2>
          {{ i18n.t('interception.doubleCountDownloadWarning', [domain.domain]) }}
        </h2>
      </div>
      <FormField
        name="Doppelt zählende Downloads"
        :initial-value="domain.allowDownloadInterception"
        class="grid-row mb-4"
      >
        <div class="flex items-center">
          <ToggleSwitch v-model="domain.allowDownloadInterception" />
          <label class="label-text pl-4">
            {{ i18n.t('settings.interception.domains.domain.allowDoubleCountDownloads') }}
          </label>
        </div>
      </FormField>
      <FormField
        name="Warnung zu doppelt zählenden Downloads"
        :initial-value="domain.dontShowDoubleCountWarning"
        class="grid-row"
      >
        <div class="flex items-center">
          <ToggleSwitch v-model="domain.dontShowDoubleCountWarning" />
          <label class="label-text pl-4">
            {{ i18n.t('settings.interception.domains.domain.ignoreDoubleCountDownloadsWarning') }}
          </label>
        </div>
      </FormField>
    </div>
    <template #footer>
      <div class="flex justify-between w-full gap-4 testClass">
        <div></div>
        <div class="flex justify-end gap-4">
          <Button type="button" :label="i18n.t('common.ok')" @click="submit()"></Button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

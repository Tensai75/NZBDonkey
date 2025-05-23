<script lang="ts" setup>
import { Form, FormField } from '@primevue/forms'
import { Button, Column, DataTable, InputText, Message, ProgressSpinner, Select } from 'primevue'
import { nextTick, onMounted, ref, Ref, watch } from 'vue'

import type { FormInstance } from '@primevue/forms'

import { i18n } from '#i18n'
import { browser, Browser } from '#imports'
import { CategorySettings, getAutomaticCategory, getDefaultCategory } from '@/services/categories'
import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { requiredResolver } from '@/services/resolvers'
import { focusPopupWindow, resizePopupWindow } from '@/utils/popupWindowUtilities'

const loaded = ref(false)
let port: Browser.runtime.Port | undefined = undefined
const nzbFiles = ref([]) as Ref<NZBFileObject[]>
const filename = ref('')

const formRef = ref<FormInstance | null>(null) // Reference to the form

document.title = i18n.t('extension.name')

browser.windows.getCurrent().then((window) => {
  log.info('connecting to background script')
  port = browser.runtime.connect({ name: 'nzbDialog_' + window.id })
  port.onMessage.addListener((message: unknown) => {
    if (typeof message === 'object' && message !== null && 'nzbfiles' in message && 'filename' in message) {
      log.info('received nzb files from background script')
      const typedMessage = message as { nzbfiles: NZBFileObject[]; filename: string }
      nzbFiles.value = typedMessage.nzbfiles
      filename.value = typedMessage.filename != '' ? typedMessage.filename : typedMessage.nzbfiles[0].title
      updateCategories()
      loaded.value = true
    } else {
      log.error('received invalid message')
    }
  })
})

function updateCategories() {
  nzbFiles.value.forEach((nzbFile) => {
    nzbFile.targets.forEach((target) => {
      let selectedCategory: string = ''
      if (target.categories.type === 'automatic') {
        selectedCategory = getAutomaticCategory(target.categories, nzbFile.title)
      } else if (target.categories.type === 'fixed') {
        selectedCategory = getDefaultCategory(target.categories)
      }
      if (selectedCategory !== '') {
        target.selectedCategory = selectedCategory
      }
    })
  })
}

function cancel() {
  if (port) {
    port.postMessage(null)
  } else {
    browser.windows.getCurrent().then((window) => {
      browser.windows.remove(window.id as number)
    })
  }
}

function submit() {
  nzbFiles.value[0].targets.forEach((target) => {
    target.selectedCategory = typeof target.selectedCategory === 'string' ? target.selectedCategory : ''
  })
  nzbFiles.value.forEach((nzbFile) => {
    nzbFile.targets = nzbFiles.value[0].targets
  })
  const files: NZBFileObject[] = []
  nzbFiles.value.forEach((nzbFile) => {
    files.push(JSON.parse(JSON.stringify(nzbFile)))
  })
  if (port) {
    log.info('sending nzbfiles back to background script')
    port.postMessage(files)
  } else {
    log.error('port is undefined')
  }
}

watch(loaded, () => {
  nextTick(() => {
    resizePopupWindow('main > *', 800, 800)
  })
  focusPopupWindow(5000)
})

// Add a keydown listener to trigger submit on Enter
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && formRef.value?.valid) {
    event.preventDefault()
    submit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
  }
}
</script>

<template>
  <div v-if="!loaded" class="flex items-center justify-center flex-grow" style="height: 100vh">
    <ProgressSpinner style="width: 60px; height: 60px" stroke-width="3" />
  </div>
  <Form
    v-if="loaded"
    ref="formRef"
    v-slot="$form"
    :validate-on-blur="true"
    :validate-on-value-update="true"
    :validate-on-mount="true"
    :validate-on-change="true"
  >
    <div class="flex flex-col h-screen w-full">
      <!-- Header -->
      <header class="flex p-4 flex-shrink">
        <div class="flex flex-row justify-between w-full">
          <div class="inline-flex items-center justify-center gap-2">
            <span class="font-bold text-lg truncate" style="max-width: 95vw; width: 95vw">{{ filename }}</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex overflow-y-auto flex-col space-y-4 px-4 h-full">
        <div v-if="nzbFiles.length === 1" class="space-y-4 flex-shrink">
          <div class="flex flex-col items-center gap-1 mb-4">
            <label for="title" class="font-semibold w-full">{{ i18n.t('common.title') }}</label>
            <FormField
              v-slot="$field"
              :name="i18n.t('common.title')"
              :initial-value="nzbFiles[0].title"
              :resolver="requiredResolver"
              class="w-full"
            >
              <InputText
                id="title"
                v-model="nzbFiles[0].title"
                class="w-full"
                size="small"
                autocomplete="off"
                type="text"
                autofocus
                @focus="$event.target.select()"
                @keyup="updateCategories()"
                @change="updateCategories()"
              />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
                $field.error?.message
              }}</Message>
            </FormField>
          </div>
          <div class="flex flex-col items-center gap-1 mb-4">
            <label for="password" class="font-semibold w-full">{{ i18n.t('common.password') }}</label>
            <InputText
              id="password"
              v-model="nzbFiles[0].password"
              class="w-full"
              size="small"
              autocomplete="off"
              type="text"
            />
          </div>
        </div>
        <div v-if="nzbFiles.length > 1" class="space-y-4" style="height: fit-content; max-height: 330px">
          <div class="flex flex-col items-center gap-1 h-full">
            <label for="title" class="font-semibold w-full">Dateien</label>
            <DataTable
              :value="nzbFiles"
              table-style=""
              size="small"
              class="w-full"
              scrollable
              scroll-height="flex"
              style="height: 95%"
            >
              <Column header-style="width: 5%">
                <template #body="slotProps">
                  <input
                    v-model="nzbFiles[slotProps.index].selected"
                    type="checkbox"
                    inputId="active"
                    name="active"
                    :value="true"
                    style="zoom: 1.5; margin-top: 2px"
                  />
                </template>
              </Column>
              <Column :header="i18n.t('common.title')" header-style="width: 50%">
                <template #body="slotProps">
                  <FormField
                    v-slot="$field"
                    :name="i18n.t('common.title') + ' ' + (slotProps.index + 1)"
                    :initial-value="nzbFiles[slotProps.index].title"
                    :resolver="requiredResolver"
                    class="w-full"
                  >
                    <InputText
                      v-model="nzbFiles[slotProps.index].title"
                      class="w-full"
                      size="small"
                      autocomplete="off"
                      type="text"
                    />
                    <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
                      $field.error?.message
                    }}</Message>
                  </FormField>
                </template>
              </Column>
              <Column field="password" header="Password" header-style="width: auto">
                <template #body="slotProps">
                  <InputText
                    id="password"
                    v-model="nzbFiles[slotProps.index].password"
                    class="w-full"
                    size="small"
                    autocomplete="off"
                    type="text"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
        <div
          v-if="
            nzbFiles[0].targets.length === 1 &&
            nzbFiles[0].targets[0].categories.useCategories &&
            nzbFiles[0].targets[0].categories.categories.length > 0
          "
          class="space-y-4"
          style="height: fit-content; max-height: 215px"
        >
          <div class="flex flex-col items-center gap-1 mb-4">
            <label for="title" class="font-semibold w-full">{{
              i18n.t('settings.nzbFileTargets.categories.category.name')
            }}</label>
            <Select
              v-if="nzbFiles[0].targets[0].categories.useCategories"
              v-model="nzbFiles[0].targets[0].selectedCategory"
              :options="nzbFiles[0].targets[0].categories.categories.filter((category) => category.active)"
              option-label="name"
              option-value="name"
              :placeholder="i18n.t('settings.nzbFileTargets.categories.selectCategory')"
              class="w-full md:w-56"
              style="width: 100%"
            ></Select>
          </div>
        </div>
        <div v-if="nzbFiles[0].targets.length > 1" class="space-y-4" style="height: fit-content; max-height: 215px">
          <div class="flex flex-col items-center gap-1 h-full">
            <label for="title" class="font-semibold w-full">{{ i18n.t('menu.settings.nzbFileTargets') }}</label>
            <DataTable
              :value="nzbFiles[0].targets"
              table-style=""
              size="small"
              class="w-full"
              style="height: 95%"
              scrollable
              scroll-height="flex"
            >
              <Column field="active" :header="i18n.t('settings.nzbFileTargets.active')" header-style="width: 5%">
                <template #body="slotProps">
                  <input
                    v-model="slotProps.data.isActive"
                    type="checkbox"
                    inputId="active"
                    name="active"
                    :value="true"
                    style="zoom: 1.5; margin-top: 2px"
                    :disabled="
                      slotProps.data.isActive && nzbFiles[0].targets.filter((target) => target.isActive).length === 1
                    "
                  />
                </template>
              </Column>
              <Column
                field="type"
                :header="i18n.t('settings.nzbFileTargets.type')"
                header-style="width: 48px; justify-content: center;"
              >
                <template #body="slotProps">
                  <span><img :src="'/img/' + slotProps.data.type + '.png'" :alt="slotProps.data.type" /></span>
                </template>
              </Column>
              <Column field="name" :header="i18n.t('settings.nzbFileTargets.name')" header-style="width: 40%"></Column>
              <Column
                field="selectedCategory"
                :header="i18n.t('settings.nzbFileTargets.categories.category.name')"
                header-style="width: auto"
              >
                <template #body="slotProps">
                  <Select
                    v-if="slotProps.data.categories.useCategories"
                    v-model="slotProps.data.selectedCategory"
                    :options="
                      (slotProps.data.categories.categories as CategorySettings[]).filter((category) => category.active)
                    "
                    option-label="name"
                    option-value="name"
                    :placeholder="i18n.t('settings.nzbFileTargets.categories.selectCategory')"
                    class="w-full md:w-56"
                    style="width: 100%"
                  ></Select>
                </template>
              </Column>

              <template #footer>
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs">
                    <i class="pi pi-arrow-up"></i>
                    {{ i18n.t('settings.nzbFileTargets.allowMultipleTargets.enabled') }}
                  </span>
                  <span class="text-xs"> </span>
                </div>
              </template>
            </DataTable>
          </div>
        </div>
      </main>
      <!-- Footer -->
      <footer class="flex flex-shrink p-4">
        <div class="flex flex-row justify-between w-full">
          <Button :label="i18n.t('common.cancel')" severity="secondary" @click="cancel()"></Button>
          <Button :disabled="!loaded || !$form.valid" :label="i18n.t('common.ok')" @click="submit()"></Button>
        </div>
      </footer>
    </div>
  </Form>
</template>

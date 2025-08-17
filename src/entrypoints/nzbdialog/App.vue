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
import { focusPopupWindow, resizePopupWindow, setZoomTo100 } from '@/utils/popupWindowUtilities'

const overlay = ref(true)
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

onMounted(() => {
  watch(loaded, () => {
    nextTick(async () => {
      await resize()
      // for some reasons the first resize does not result in correct heights because
      // scrollHeights are not reliable during the first resize even with the additional delay
      nextTick(async () => {
        await resize(true)
        overlay.value = false
        focusPopupWindow(5000)
      })
    })
  })
  // Add a keydown listener to trigger submit on Enter
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

function resize(secondResize = false) {
  return new Promise<void>((resolve) => {
    setZoomTo100().then(() => {
      // 100 ms delay to ensure the DOM is fully rendered before resizing
      // required especially for Firefox in order to get correct scrollHeights in second resize
      // seemingly not required for Chrome but more testing woul be needed
      setTimeout(async () => {
        const maxWidth = 800 > screen.availWidth ? screen.availWidth : 800
        const maxHeight = 800 > screen.availHeight ? screen.availHeight : 800
        let lowerContentMaxHeight = 245
        let upperContentMaxHeight: number
        const headerHeight = document.getElementById('header')?.scrollHeight
        const footerHeight = document.getElementById('footer')?.scrollHeight
        const upperContent = document.getElementById('nzbFiles')
        const lowerContent = document.getElementById('targets')
        let upperContentHeight = upperContent?.scrollHeight
        let lowerContentHeight = lowerContent?.scrollHeight || 0
        // debug console output
        // console.log(`resize ${secondResize ? '2' : '1'}`)
        // console.log('upperContentHeight:', upperContentHeight)
        // console.log('lowerContentHeight:', lowerContentHeight)
        if (headerHeight === undefined || footerHeight === undefined || upperContentHeight === undefined) {
          log.error('resizing the window failed because one or more elements were not found')
          resolve()
          return
        }
        const availableHeight = maxHeight - headerHeight - footerHeight
        lowerContentMaxHeight = 800 > screen.availHeight ? availableHeight * (2 / 5) : lowerContentMaxHeight
        if (upperContentHeight + lowerContentHeight > availableHeight) {
          lowerContentMaxHeight =
            lowerContentHeight >= lowerContentMaxHeight ? lowerContentMaxHeight : lowerContentHeight
          upperContentMaxHeight = availableHeight - lowerContentMaxHeight
        } else {
          lowerContentMaxHeight = lowerContentHeight
          upperContentMaxHeight = upperContentHeight
        }
        // only set the maxHeights and heights during the second resize
        // for some reasons scrollHeights are not reliable during the first resize even with the delay
        if (secondResize) {
          if (lowerContent) {
            lowerContent.style.maxHeight = `${lowerContentMaxHeight}px`
            lowerContent.style.height = `${lowerContentMaxHeight}px`
          }
          if (upperContent) {
            upperContent.style.maxHeight = `${upperContentMaxHeight}px`
            upperContent.style.height = `${upperContentMaxHeight}px`
          }
        }
        const containerHeight = headerHeight + footerHeight + upperContentMaxHeight + lowerContentMaxHeight
        await resizePopupWindow(maxWidth, containerHeight)
        resolve()
      }, 100)
    })
  })
}
</script>

<template>
  <div v-if="overlay" class="overlay">
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
    <div id="container">
      <!-- Header -->
      <header id="header" class="p-4">
        <div class="flex flex-row justify-between w-full">
          <div class="inline-flex items-center justify-center gap-2 w-full">
            <span class="font-bold text-lg w-full truncate">{{ filename }}</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main id="main" class="px-4">
        <!-- NZB files -->
        <div v-if="nzbFiles.length === 1" id="nzbFiles">
          <div class="gap-1 pb-4">
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
                @focus="($event.target as HTMLInputElement)?.select()"
                @keyup="updateCategories()"
                @change="updateCategories()"
              />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
                $field.error?.message
              }}</Message>
            </FormField>
          </div>
          <div class="gap-1 pb-4">
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
        <template v-if="nzbFiles.length > 1">
          <div id="nzbFiles" class="gap-1 h-full">
            <DataTable :value="nzbFiles" table-style="" size="small" class="w-full" scrollable scroll-height="flex">
              <template #header>
                <label for="title" class="font-semibold w-full">{{ i18n.t('common.files') }}</label>
              </template>
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
        </template>
        <!-- Targets -->
        <template
          v-if="
            nzbFiles[0].targets.length === 1 &&
            nzbFiles[0].targets[0].categories.useCategories &&
            nzbFiles[0].targets[0].categories.categories.length > 0
          "
        >
          <div id="targets" class="gap-1 pt-4">
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
        </template>
        <template v-if="nzbFiles[0].targets.length > 1">
          <div id="targets" class="gap-1 pt-4 h-full">
            <DataTable
              :value="nzbFiles[0].targets"
              table-style=""
              size="small"
              class="w-full"
              scrollable
              scroll-height="flex"
            >
              <template #header>
                <label for="title" class="font-semibold w-full">{{ i18n.t('menu.settings.nzbFileTargets') }}</label>
              </template>
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
              <Column field="name" :header="i18n.t('settings.nzbFileTargets.name')" header-style="width: auto"></Column>
              <Column
                v-if="nzbFiles[0].targets.some((target) => target.categories.useCategories)"
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
        </template>
      </main>

      <!-- Footer -->
      <footer id="footer" class="p-4">
        <div class="flex flex-row justify-between w-full">
          <Button :label="i18n.t('common.cancel')" severity="secondary" @click="cancel()"></Button>
          <Button :disabled="!loaded || !$form.valid" :label="i18n.t('common.ok')" @click="submit()"></Button>
        </div>
      </footer>
    </div>
  </Form>
</template>
<style lang="css">
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#container {
  display: flex;
  flex-direction: column;
  max-width: 800px;
  max-height: 800px;
  margin: 0 auto;
  box-sizing: border-box;
  border: 0px;
}

#header,
#footer {
  flex-shrink: 0;
}

#main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

#nzbFiles,
#targets {
  overflow-y: auto;
  box-sizing: border-box;
  margin-top: 0;
  overflow: hidden;
}

#nzbFiles {
  flex-grow: 1;
}

#targets {
  flex-grow: 1;
}

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

<script setup lang="ts">
import { Button, Column, DataTable, Fieldset, RadioButton, useConfirm } from 'primevue'
import { ref, Ref } from 'vue'
import { PublicPath } from 'wxt/browser'

import { i18n } from '#i18n'
import { browser } from '#imports'
import EditSearchEngineDialog from '@/components/searchengines/searchengineEditDialog.vue'
import {
  SearchEngine,
  Settings as SearchEngineSettings,
  useSettings as useSearchEngineSettings,
} from '@/services/searchengines'

const settings: Ref<SearchEngineSettings> = await useSearchEngineSettings()

const onRowReorder = ({ value }: { value: SearchEngine[] }): void => {
  settings.value.engines = value
}

const confirm = useConfirm()

const confirmDelete = (index: number): void => {
  confirm.require({
    message: i18n.t('settings.searchEngines.confirmDelete.message', [settings.value.engines[index].name]),
    header: i18n.t('settings.searchEngines.confirmDelete.header'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: i18n.t('common.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: i18n.t('common.delete'),
      severity: 'danger',
    },
    accept: () => {
      settings.value.engines.splice(index, 1)
    },
    reject: () => {
      // void
    },
  })
}

const showEditSearchEngineDialog = ref(false)
const engineIndex = ref(0)

const showEditDialog = (index: number) => {
  engineIndex.value = index
  showEditSearchEngineDialog.value = true
}

const showAddDialog = () => {
  engineIndex.value = settings.value.engines.length
  showEditSearchEngineDialog.value = true
}
</script>

<template>
  <div class="mb-4">
    <Fieldset :legend="i18n.t('settings.searchEngines.searchOrder.title')">
      <div class="flex items-center gap-2 mb-4">
        <RadioButton v-model="settings.searchOrder" input-id="parallel" name="searchOrder" value="parallel" />
        <label for="parallel">{{ i18n.t('settings.searchEngines.searchOrder.parallel') }}</label>
      </div>
      <div class="flex items-center gap-2">
        <RadioButton v-model="settings.searchOrder" input-id="sequential" name="searchOrder" value="sequential" />
        <label for="sequential">{{ i18n.t('settings.searchEngines.searchOrder.sequential') }}</label>
      </div>
    </Fieldset>
  </div>
  <div class="mb-4">
    <Fieldset :legend="i18n.t('settings.searchEngines.engines.title')">
      <div class="card">
        <DataTable :value="settings.engines" table-style="" size="small" @row-reorder="onRowReorder">
          <Column
            v-if="settings.searchOrder == 'sequential'"
            row-reorder
            header-style="width: 1%"
            :reorderable-column="false"
          />
          <Column
            field="active"
            :header="i18n.t('settings.searchEngines.engines.engine.active')"
            header-style="width: 1%"
          >
            <template #body="slotProps">
              <input
                v-model="slotProps.data.isActive"
                type="checkbox"
                inputId="isActive"
                name="isActive"
                :value="true"
                style="zoom: 1.5; margin-top: 2px"
              />
            </template>
          </Column>
          <Column header-style="width: 32px">
            <template #body="slotProps">
              <img
                alt="Favicon"
                :src="
                  slotProps.data.icon
                    ? slotProps.data.icon
                    : browser.runtime.getURL('/img/searchengine.png' as PublicPath)
                "
                style="width: 16px; height: 16px"
              />
            </template>
          </Column>
          <Column
            field="name"
            :header="i18n.t('settings.searchEngines.engines.engine.title')"
            header-style="width: auto"
          ></Column>
          <Column header-style="width: 1%; padding-right: 0px">
            <template #body="slotProps">
              <Button
                icon="pi pi-trash"
                variant="outlined"
                raised
                size="small"
                rounded
                severity="danger"
                @click="confirmDelete(slotProps.index)"
              />
            </template>
          </Column>
          <Column header-style="width: 1%">
            <template #body="slotProps">
              <Button
                :icon="slotProps.data.isDefault ? 'pi pi-eye' : 'pi pi-pencil'"
                variant="outlined"
                raised
                size="small"
                rounded
                @click="showEditDialog(slotProps.index)"
              />
            </template>
          </Column>
          <template #empty>
            <div class="w-full text-center text-red-600 text-xl font-bold p-4">
              {{ i18n.t('settings.searchEngines.noSearchEnginesDefined') }}
            </div>
          </template>
          <template #footer>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs">
                <template v-if="settings.searchOrder == 'sequential'">
                  <i class="pi pi-arrow-up"></i>
                  {{ i18n.t('settings.searchEngines.reorder') }}
                </template>
              </span>
              <Button
                :label="i18n.t('settings.searchEngines.addNewSearchEngine')"
                raised
                variant="outlined"
                size="small"
                style="width: auto !important"
                @click="showAddDialog()"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </Fieldset>
  </div>
  <EditSearchEngineDialog
    v-if="showEditSearchEngineDialog"
    :engines="settings.engines"
    :index="engineIndex"
    @close="showEditSearchEngineDialog = false"
    @save="
      (searchEngine: SearchEngine) => {
        settings.engines[engineIndex] = searchEngine
        showEditSearchEngineDialog = false
      }
    "
  >
  </EditSearchEngineDialog>
</template>

<script lang="ts" setup>
import { FilterMatchMode } from '@primevue/core/api'
import { Button, Column, DataTable, InputText, Select, Tag } from 'primevue'
import { useConfirm } from 'primevue/useconfirm'
import { onMounted, ref } from 'vue'

import { i18n } from '#i18n'
import debug from '@/services/logger/debugLogger'
import { IDebugLog } from '@/services/logger/loggerDB'

const debugLog = ref<IDebugLog[]>()
const loading = ref(true)
const filters = ref()
const types = ref(['info', 'warn', 'error'])
const severities = {
  info: 'info',
  warn: 'warn',
  error: 'danger',
}
const sources = ref<string[]>([])

const dt = ref()
const exportCSV = () => {
  dt.value.exportCSV()
}

const initFilters = () => {
  filters.value = {
    date: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    type: { value: null, matchMode: FilterMatchMode.EQUALS },
    text: { value: null, matchMode: FilterMatchMode.CONTAINS },
    source: { value: null, matchMode: FilterMatchMode.EQUALS },
  }
}
initFilters()

const confirm = useConfirm()
const confirmDelete = (): void => {
  confirm.require({
    message: i18n.t('logger.debugLog.confirmDeleteDebuglog.message'),
    header: i18n.t('logger.debugLog.confirmDeleteDebuglog.header'),
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
    accept: async () => {
      debug.clear()
      debugLog.value = await debug.get()
    },
    reject: () => {
      // void
    },
  })
}

onMounted(async () => {
  debugLog.value = await debug.get()
  sources.value = Array.from(new Set(debugLog.value.map((item) => item.source)))
  loading.value = false
})
</script>

<template>
  <DataTable
    ref="dt"
    v-model:filters="filters"
    filter-display="menu"
    scrollable
    scroll-height="flex"
    export-filename="debug-log"
    sort-field="date"
    :sort-order="-1"
    :value="debugLog"
    :loading="loading"
    table-style="width: 100%; min-width: 100%; max-width: 100%;"
  >
    <template #empty> {{ i18n.t('logger.noEntries') }} </template>
    <template #loading> {{ i18n.t('logger.loadingLogs') }} </template>

    <Column field="date" :header="`${i18n.t('common.date')} / ${i18n.t('common.time')}`" sortable style="width: 1%">
      <template #body="slotProps">
        {{ new Date(slotProps.data.date).toISOString() }}
      </template>
    </Column>
    <Column field="type" :header="i18n.t('logger.debugLog.type')" sortable style="width: 1%">
      <template #body="{ data }">
        <Tag :value="data.type" :severity="severities[data.type as keyof typeof severities]" />
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <Select
          v-model="filterModel.value"
          :options="types"
          placeholder="Select One"
          style="min-width: 12rem"
          :show-clear="true"
          @change="filterCallback()"
        >
          <template #option="slotProps">
            <Tag :value="slotProps.option" :severity="severities[slotProps.option as keyof typeof severities]" />
          </template>
        </Select>
      </template>
    </Column>
    <Column
      field="text"
      :header="i18n.t('common.text')"
      sortable
      style="width: 350px; max-width: 350px; overflow: hidden"
    >
      <template #filter="{ filterModel }">
        <div class="flex flex-row items-center gap-2">
          <InputText v-model="filterModel.value" type="text" placeholder="Search" size="small" />
          <Button
            type="button"
            icon="pi pi-times"
            severity="secondary"
            size="small"
            @click="filterModel.value = ''"
          ></Button>
        </div>
      </template>
      <template #body="data">
        {{ data.data.text + (data.data.error && data.data.error != '' ? ` [${data.data.error}]` : '') }}
      </template>
    </Column>
    <Column field="error" :header="i18n.t('common.error')" hidden></Column>
    <Column field="source" :header="i18n.t('common.source')" sortable style="width: 1%">
      <template #filter="{ filterModel, filterCallback }">
        <Select
          v-model="filterModel.value"
          :options="sources"
          placeholder="Select One"
          style="min-width: 6rem"
          :show-clear="true"
          @change="filterCallback()"
        >
          <template #option="slotProps">
            <Tag :value="slotProps.option" severity="secondary" />
          </template>
        </Select>
      </template>
    </Column>
    <template #footer="">
      <div class="flex flex-row justify-between items-center gap-2">
        <Button
          :label="i18n.t('logger.exportCSV')"
          icon="pi pi-download"
          severity="secondary"
          size="small"
          @click="exportCSV()"
        ></Button>
        <Button
          :label="i18n.t('logger.clearLog')"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          @click="confirmDelete()"
        ></Button>
      </div>
    </template>
  </DataTable>
</template>

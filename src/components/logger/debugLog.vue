<script lang="ts" setup>
import { FilterMatchMode } from '@primevue/core/api'
import { formatDate } from '@vueuse/core'
import { Button, Column, DataTable, InputText, Select, Skeleton, Tag } from 'primevue'
import { useConfirm } from 'primevue/useconfirm'
import { ref } from 'vue'

import { i18n } from '#i18n'
import debugLogger from '@/services/logger/debugLogger'
import { DebugLogQuery, DebugLogType, IDebugLog } from '@/services/logger/loggerDB'

const totalCount = ref(0)
const debugLogs = ref([] as IDebugLog[])
const debugLogQuery = ref<DebugLogQuery>({
  first: 0,
  last: 50,
  sortField: 'date',
  sortOrder: 'desc',
  filter: {
    source: undefined,
    type: undefined,
    text: undefined,
  },
})
const lazyLoading = ref(false)
const filters = ref({
  type: { value: null, matchMode: FilterMatchMode.EQUALS },
  text: { value: null, matchMode: FilterMatchMode.CONTAINS },
  source: { value: null, matchMode: FilterMatchMode.EQUALS },
})
const loaded = ref(false)
const dataTable = ref(0)
const types = ref(['info', 'warn', 'error'])
const severities = {
  info: 'info',
  warn: 'warn',
  error: 'danger',
}
const sources = ref<string[]>([])

const loadLogsLazy = async (event: { first: number; last: number }, showLoader: boolean = true) => {
  try {
    if (lazyLoading.value) return // Prevent multiple loads
    if (showLoader) lazyLoading.value = true

    const noLogs = () => {
      // If no logs are available, reset the array and exit
      debugLogs.value = []
      lazyLoading.value = false
      if (!loaded.value) loaded.value = true
      return
    }

    debugLogQuery.value.first = event.first
    debugLogQuery.value.last = event.last > 0 ? event.last : 50 // Ensure last is at least 50 if not provided

    // Load total count and check if it has changed
    await loadTotalCount()
    if (totalCount.value === 0) return noLogs()
    if (debugLogQuery.value.last > totalCount.value) {
      debugLogQuery.value.last = totalCount.value
    }

    // Load required data
    const loadedLogs = await debugLogger.getLazy(debugLogQuery.value)
    if (loadedLogs.length === 0) return noLogs()

    // Extract unique sources from loaded logs
    sources.value = await debugLogger.getSources()

    // Populate virtual logs
    var _debugLogs = Array.from<IDebugLog>({ length: totalCount.value }) // Initialize with empty logs
    _debugLogs.splice(debugLogQuery.value.first, debugLogQuery.value.last - debugLogQuery.value.first, ...loadedLogs)
    debugLogs.value = _debugLogs
    lazyLoading.value = false
    if (!loaded.value) loaded.value = true
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    debugLogger.error(`Error loading logs lazy: ${error.message}`, error)
  }
}

const exportCSV = () => {
  debugLogger.download()
}

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
      debugLogger.clear()
      loadLogsLazy({ first: 0, last: 50 }) // Reload the logs after clearing
    },
    reject: () => {
      // void
    },
  })
}

function setSortOrder(order: number | undefined) {
  debugLogQuery.value.sortOrder = order === 1 ? 'asc' : 'desc'
  loadLogsLazy({ first: 0, last: 50 })
}

function setSortField(field: string | undefined) {
  debugLogQuery.value.sortField = field === 'date' ? 'date' : undefined
  loadLogsLazy({ first: 0, last: 50 })
}

function setFilter(event: { source?: { value: string }; type?: { value: DebugLogType }; text?: { value: string } }) {
  debugLogQuery.value.filter!.source = event.source?.value || undefined
  debugLogQuery.value.filter!.type = event.type?.value || undefined
  debugLogQuery.value.filter!.text = event.text?.value || undefined
  loadLogsLazy({ first: 0, last: 50 })
}

async function loadTotalCount() {
  const count = await debugLogger.count(debugLogQuery.value)
  if (count !== totalCount.value) {
    totalCount.value = count
    dataTable.value++ // Force DataTable to refresh if total count changed
  }
}
</script>

<template>
  <DataTable
    :key="dataTable"
    v-model:filters="filters"
    filter-display="menu"
    :value="debugLogs"
    scrollable
    scroll-height="flex"
    table-style="min-width: 100%; max-width: 100%; width: 100%"
    :virtual-scroller-options="{
      lazy: true,
      onLazyLoad: loadLogsLazy,
      itemSize: 64,
      delay: 0,
      showLoader: false,
      loading: false, // lazyLoading,
      numToleratedItems: 20,
    }"
    :sort-order="debugLogQuery.sortOrder === 'asc' ? 1 : -1"
    :sort-field="debugLogQuery.sortField"
    @update:sort-field="(event) => setSortField(event)"
    @update:sort-order="(event) => setSortOrder(event)"
    @update:filters="(event) => setFilter(event)"
  >
    <template #empty>
      <div v-if="loaded" class="w-full flex items-center justify-center" style="height: 120px">
        {{ i18n.t('logger.noEntries') }}
      </div>
      <div v-else class="w-full flex items-center justify-center" style="height: 120px">
        {{ i18n.t('logger.loadingLogs') }}
      </div>
    </template>

    <Column class="td_date" field="date" :header="`${i18n.t('common.time')}`" sortable>
      <template #body="{ data }">
        <div class="flex td_date">
          <div v-if="data?.date" class="flex items-center">
            {{ formatDate(new Date(data.date), 'DD.MM.YYYY') }}
            {{ formatDate(new Date(data.date), 'HH:mm:ss.SSS') }}
          </div>
          <div v-else class="flex items-center w-full">
            <Skeleton width="100%" height="80%" />
          </div>
        </div>
      </template>
    </Column>
    <Column class="td_type" field="type" :header="i18n.t('logger.debugLog.type')">
      <template #body="{ data }">
        <div class="flex td_type">
          <div v-if="data?.type" class="flex items-center">
            <Tag :value="data.type" :severity="severities[data.type as keyof typeof severities]" />
          </div>
          <div v-else class="flex items-center w-full">
            <Skeleton width="100%" height="80%" />
          </div>
        </div>
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <Select
          v-model="filterModel.value"
          :options="types"
          :placeholder="i18n.t('common.selectFilter')"
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
    <Column class="td_text" field="text" :header="i18n.t('common.text')">
      <template #body="data">
        <div class="flex td_text">
          <div v-if="data?.data?.text" class="flex flex-col justify-center my-auto">
            {{ data.data.text + (data.data.error && data.data.error != '' ? ` [${data.data.error}]` : '') }}
          </div>
          <div v-else class="flex items-center w-full">
            <Skeleton width="100%" height="80%" />
          </div>
        </div>
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <div class="flex flex-row items-center gap-2">
          <InputText
            v-model="filterModel.value"
            type="text"
            :placeholder="i18n.t('common.search')"
            size="small"
            @change="filterCallback()"
          />
          <Button
            type="button"
            icon="pi pi-times"
            severity="secondary"
            size="small"
            @click="filterModel.value = ''"
          ></Button>
        </div>
      </template>
    </Column>
    <Column class="td_source" field="source" :header="i18n.t('common.source')">
      <template #body="{ data }">
        <div class="flex td_source">
          <div v-if="data?.source" class="flex items-center">
            {{ data.source }}
          </div>
          <div v-else class="flex items-center w-full">
            <Skeleton width="100%" height="80%" />
          </div>
        </div>
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <Select
          v-model="filterModel.value"
          :options="sources"
          :placeholder="i18n.t('common.selectFilter')"
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
      <div class="flex flex-row justify-between items-center gap-2" style="margin: 0 -1rem">
        <Button
          :label="i18n.t('logger.exportCSV')"
          icon="pi pi-download"
          severity="secondary"
          size="small"
          :disabled="totalCount === 0"
          style="margin-left: 8px"
          @click="exportCSV()"
        ></Button>
        <Button
          :label="i18n.t('logger.update')"
          icon="pi pi-sync"
          severity="primary"
          size="small"
          @click="dataTable++"
        ></Button>
        <Button
          :label="i18n.t('logger.clearLog')"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          :disabled="totalCount === 0"
          style="margin-right: 8px"
          @click="confirmDelete()"
        ></Button>
      </div>
    </template>
  </DataTable>
</template>

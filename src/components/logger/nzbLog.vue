<script lang="ts" setup>
import { FilterMatchMode } from '@primevue/core/api'
import { Button, Column, DataTable, InputText, Select, Skeleton, Tag } from 'primevue'
import { useConfirm } from 'primevue/useconfirm'
import { ref } from 'vue'

import { i18n } from '#i18n'
import NZBLogInfo from '@/components/logger/nzbLogInfo.vue'
import NZBDonkeyLogo from '@/components/nzbdonkeyLogo.vue'
import ScrollText from '@/components/scrollText.vue'
import log from '@/services/logger/debugLogger'
import { INZBLog, NZBLogQuery, NZBStatus } from '@/services/logger/loggerDB'
import nzbLogger from '@/services/logger/nzbLogger'

const totalCount = ref(0)
const nzbLogs = ref([] as INZBLog[])
const nzbLogQuery = ref<NZBLogQuery>({
  first: 0,
  last: 50,
  filter: {
    status: undefined,
    information: undefined,
  },
})
const lazyLoading = ref(false)
const filters = ref({
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  title: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
const loaded = ref(false)
const dataTable = ref(0)
const availableStatuses = ref<NZBStatus[]>([])

const colors = {
  initiated: 'var(--p-primary-600)',
  pending: 'var(--p-primary-600)',
  searching: 'var(--p-primary-600)',
  fetched: 'var(--p-primary-600)',
  success: 'var(--p-green-600)',
  warn: 'var(--p-amber-800)',
  error: 'var(--p-red-800)',
  inactive: 'var(--p-gray-600)',
}

const severities = {
  initiated: 'primary',
  pending: 'primary',
  searching: 'primary',
  fetched: 'primary',
  success: 'success',
  warn: 'warn',
  error: 'danger',
  inactive: 'secondary',
}

const statuses = {
  initiated: i18n.t('common.initiated'),
  searching: i18n.t('common.searching'),
  fetched: i18n.t('common.fetched'),
  success: i18n.t('common.success'),
  warn: i18n.t('common.warn'),
  error: i18n.t('common.error'),
  inactive: i18n.t('common.inactive'),
}

const loadLogsLazy = async (event: { first: number; last: number }, showLoader: boolean = true) => {
  try {
    if (lazyLoading.value) return // Prevent multiple loads
    if (showLoader) lazyLoading.value = true

    const noLogs = () => {
      // If no logs are available, reset the array and exit
      nzbLogs.value = []
      lazyLoading.value = false
      if (!loaded.value) loaded.value = true
      return
    }

    nzbLogQuery.value.first = event.first
    nzbLogQuery.value.last = event.last > 0 ? event.last : 50 // Ensure last is at least 50 if not provided

    // Load total count and check if it has changed
    await loadTotalCount()
    if (totalCount.value === 0) return noLogs()
    if (nzbLogQuery.value.last > totalCount.value) {
      nzbLogQuery.value.last = totalCount.value
    }

    // Load required data
    const loadedLogs = await nzbLogger.getLazy(nzbLogQuery.value)
    if (loadedLogs.length === 0) return noLogs()

    // Extract unique statuses from loaded logs
    availableStatuses.value = await nzbLogger.getStatuses()

    // Populate virtual logs
    var _nzbLogs = Array.from<INZBLog>({ length: totalCount.value }) // Initialize with empty logs
    _nzbLogs.splice(nzbLogQuery.value.first, nzbLogQuery.value.last - nzbLogQuery.value.first, ...loadedLogs)
    nzbLogs.value = _nzbLogs
    lazyLoading.value = false
    if (!loaded.value) loaded.value = true
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`Error loading logs lazy: ${error.message}`, error)
  }
}

const exportCSV = () => {
  nzbLogger.download()
}

const confirm = useConfirm()
const confirmDelete = (): void => {
  confirm.require({
    message: i18n.t('logger.nzbLog.confirmDeleteNzblog.message'),
    header: i18n.t('logger.nzbLog.confirmDeleteNzblog.header'),
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
      nzbLogger.clear()
      loadLogsLazy({ first: 0, last: 50 }) // Reload the logs after clearing
    },
    reject: () => {
      // void
    },
  })
}

async function loadTotalCount() {
  const count = await nzbLogger.count(nzbLogQuery.value)
  if (count !== totalCount.value) {
    totalCount.value = count
    dataTable.value++ // Force DataTable to refresh if total count changed
  }
}

function setFilter(event: { status?: { value: NZBStatus }; title?: { value: string } }) {
  nzbLogQuery.value.filter!.status = event.status?.value || undefined
  nzbLogQuery.value.filter!.information = event.title?.value || undefined
  loadLogsLazy({ first: 0, last: 50 })
}
</script>

<template>
  <DataTable
    :key="dataTable"
    v-model:filters="filters"
    filter-display="menu"
    :value="nzbLogs"
    scrollable
    scroll-height="flex"
    table-style="min-width: 100%; max-width: 100%; width: 100%"
    :virtual-scroller-options="{
      lazy: true,
      onLazyLoad: loadLogsLazy,
      itemSize: 101,
      delay: 0,
      showLoader: false,
      loading: false, // lazyLoading,
      numToleratedItems: 20,
    }"
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

    <Column class="td_logo" field="status" :header="i18n.t('common.status')">
      <template #body="{ data }">
        <div class="flex td_logo">
          <NZBDonkeyLogo
            v-if="data?.status"
            v-tooltip.right-start="data?.errorMessage ?? statuses[data?.status as keyof typeof statuses]"
            :color="colors[data?.status as keyof typeof colors]"
            size="48"
            class="cursor-help"
          />
          <div v-else class="flex items-center w-full">
            <Skeleton width="48px" height="48px" />
          </div>
        </div>
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <Select
          v-model="filterModel.value"
          :options="availableStatuses"
          :placeholder="i18n.t('common.selectFilter')"
          style="min-width: 12rem"
          :show-clear="true"
          @change="filterCallback()"
        >
          <template #option="slotProps">
            <Tag
              :value="statuses[slotProps.option as keyof typeof statuses]"
              :severity="severities[slotProps.option as keyof typeof severities]"
            />
          </template>
        </Select>
      </template>
    </Column>
    <Column class="td_info" field="title" :header="i18n.t('common.information')">
      <template #body="{ data }">
        <div class="flex td_info">
          <NZBLogInfo v-if="data?.title" :data="data" class="my-auto" />
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
    <Column class="td_targets" :header="i18n.t('settings.nzbFileTargets.title')">
      <template #body="{ data }">
        <div class="flex td_targets">
          <div v-if="data?.targets" class="flex flex-col justify-center my-auto">
            <Tag
              v-for="target in data?.targets"
              :key="target.name"
              v-tooltip.left-start="target.errorMessage ?? statuses[target.status as keyof typeof statuses]"
              :severity="severities[target.status as keyof typeof severities]"
              :title="target.errorMessage"
              rounded
              style="
                font-weight: 600;
                font-size: 0.8rem;
                padding: 0 0.5rem !important;
                margin: 2px 0 2px 0 !important;
                justify-content: left;
                max-width: 117px;
              "
              class="cursor-help"
            >
              <ScrollText :start-on-hover="true" :constant-speed="true" :speed="40" :pause-at-ends="2">
                {{ target.name }}
              </ScrollText>
            </Tag>
          </div>
          <div v-else class="flex items-center w-full">
            <Skeleton width="100%" height="80%" />
          </div>
        </div>
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

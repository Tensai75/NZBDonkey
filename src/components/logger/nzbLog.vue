<script lang="ts" setup>
import { Button, Column, DataTable, Tag } from 'primevue'
import { useConfirm } from 'primevue/useconfirm'
import { onMounted, ref } from 'vue'

import { i18n } from '#i18n'
import NZBDonkeyLogo from '@/components/nzbdonkeyLogo.vue'
import log from '@/services/logger/debugLogger'
import { INZBLog } from '@/services/logger/loggerDB'
import nzb from '@/services/logger/nzbLogger'

const nzbLog = ref<INZBLog[]>()
const loading = ref(true)
const filters = ref()

const colors = {
  initiated: 'var(--p-primary-600)',
  searching: 'var(--p-primary-600)',
  fetched: 'var(--p-primary-600)',
  success: 'var(--p-green-600)',
  warn: 'var(--p-amber-800)',
  error: 'var(--p-red-800)',
}

const severity = {
  inactive: 'secondary',
  pending: 'primary',
  success: 'success',
  error: 'danger',
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

const dt = ref()
const exportCSV = () => {
  dt.value.exportCSV()
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
      nzb.clear()
      nzbLog.value = await nzb.get()
    },
    reject: () => {
      // void
    },
  })
}

function copyToClipboard(text: string): void {
  if (navigator.clipboard && window.isSecureContext) {
    // Use Clipboard API if available and in a secure context
    navigator.clipboard.writeText(text).catch((err) => {
      log.error('Failed to copy text: ', err)
    })
  } else {
    log.error('Clipboard API not available or not in a secure context')
  }
}

onMounted(async () => {
  nzbLog.value = await nzb.get()
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
    export-filename="nzb-log"
    sort-field="date"
    :sort-order="-1"
    :value="nzbLog"
    :loading="loading"
    table-style="min-width: 100%; max-width: 100%; width: 100%"
  >
    <template #empty> {{ i18n.t('logger.noEntries') }} </template>
    <template #loading> {{ i18n.t('logger.loadingLogs') }} </template>

    <Column field="id" hidden></Column>
    <Column field="date" hidden></Column>
    <Column field="status" hidden></Column>
    <Column field="title" hidden></Column>
    <Column field="header" hidden></Column>
    <Column field="password" hidden></Column>
    <Column field="filename" hidden></Column>
    <Column field="searchEngine" hidden></Column>
    <Column field="source" hidden></Column>
    <Column field="errorMessage" hidden></Column>
    <Column :header="i18n.t('common.status')" style="width: 1%">
      <template #body="{ data }">
        <NZBDonkeyLogo
          v-tooltip.right-start="data.errorMessage ?? statuses[data.status as keyof typeof statuses]"
          :color="colors[data.status as keyof typeof colors]"
          size="48"
          class="cursor-help"
        />
      </template>
    </Column>
    <Column :header="i18n.t('common.information')" style="max-width: 300px">
      <template #body="{ data }">
        <div class="flex flex-col">
          <div class="flex flex-row w-full gap-x-4">
            <div class="flex-[4] text-right">{{ i18n.t('common.title') }}:</div>
            <div class="flex-[16] truncate" :title="data.title">{{ data.title }}</div>
            <i
              v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.title')])"
              class="flex-1 pi pi-copy cursor-pointer"
              @click="copyToClipboard(data.title)"
            ></i>
          </div>
          <div v-if="data.header" class="flex flex-row w-full gap-x-4">
            <div class="flex-[4] text-right">{{ i18n.t('common.header') }}:</div>
            <div class="flex-[16] truncate" :title="data.header">{{ data.header }}</div>
            <i
              v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.header')])"
              class="flex-1 pi pi-copy cursor-pointer"
              @click="copyToClipboard(data.header)"
            ></i>
          </div>
          <div v-if="data.password" class="flex flex-row w-full gap-x-4">
            <div class="flex-[4] text-right">{{ i18n.t('common.password') }}:</div>
            <div class="flex-[16] truncate" :title="data.password">{{ data.password }}</div>
            <i
              v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.password')])"
              class="flex-1 pi pi-copy cursor-pointer"
              @click="copyToClipboard(data.password)"
            ></i>
          </div>
          <div v-if="data.source" class="flex flex-row w-full gap-x-4">
            <div class="flex-[4] text-right">{{ i18n.t('common.source') }}:</div>
            <div class="flex-[16] truncate" :title="data.source">
              <a v-if="data.source.startsWith('http')" :href="data.source" target="_blank">
                {{ data.source }}
              </a>
              <span v-else>{{ data.source }}</span>
            </div>
            <i
              v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.source')])"
              class="flex-1 pi pi-copy cursor-pointer"
              @click="copyToClipboard(data.source)"
            ></i>
          </div>
          <div v-if="data.searchEngine" class="flex flex-row w-full gap-x-4">
            <div class="flex-[4] text-right">{{ i18n.t('common.searchEngine') }}:</div>
            <div class="flex-[16] truncate" :title="data.searchEngine">{{ data.searchEngine }}</div>
            <i
              v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.searchEngine')])"
              class="flex-1 pi pi-copy cursor-pointer"
              @click="copyToClipboard(data.searchEngine)"
            ></i>
          </div>
        </div>
      </template>
    </Column>
    <Column :header="i18n.t('settings.nzbFileTargets.title')" style="max-width: 120px">
      <template #body="{ data }">
        <Tag
          v-for="target in data.targets"
          :key="target.name"
          v-tooltip.left-start="target.errorMessage ?? statuses[target.status as keyof typeof statuses]"
          :severity="severity[target.status as keyof typeof severity]"
          :value="target.name"
          :title="target.errorMessage"
          rounded
          style="
            font-weight: 600;
            font-size: 0.7rem;
            padding: 0 0.5rem !important;
            margin-bottom: 4px;
            word-wrap: none;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
            justify-content: left;
          "
          class="cursor-help"
        />
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

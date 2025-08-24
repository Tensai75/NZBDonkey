<script setup lang="ts">
import { i18n } from '#i18n'
import ScrollText from '@/components/scrollText.vue'
import log from '@/services/logger/debugLogger'

defineProps<{
  data?: {
    title?: string
    header?: string
    password?: string
    source?: string
    searchEngine?: string
  }
}>()

function copyToClipboard(text: string | undefined): void {
  if (text === undefined || text.trim() === '') return
  if (navigator.clipboard && window.isSecureContext) {
    // Use Clipboard API if available and in a secure context
    navigator.clipboard.writeText(text).catch((err) => {
      log.error('Failed to copy text: ', err)
    })
  } else {
    log.error('Clipboard API not available or not in a secure context')
  }
}
</script>
<template>
  <table class="w-full text-xs">
    <tbody>
      <tr>
        <td class="text-right font-semibold align-middle w-1/5 whitespace-nowrap p-0">{{ i18n.t('common.title') }}:</td>
        <td class="truncate align-middle w-4/5 px-2 py-0" style="max-width: 1px" :title="data?.title">
          <ScrollText :start-on-hover="true" :constant-speed="true" :speed="60" :pause-at-ends="2">
            {{ data?.title }}
          </ScrollText>
        </td>
        <td class="align-middle w-1 p-0">
          <i
            v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.title')])"
            class="pi pi-copy cursor-pointer text-xs"
            @click="copyToClipboard(data?.title)"
          ></i>
        </td>
      </tr>
      <tr v-if="data?.header">
        <td class="text-right font-semibold align-middle w-1/5 whitespace-nowrap p-0">
          {{ i18n.t('common.header') }}:
        </td>
        <td class="truncate align-middle w-4/5 px-2 py-0" style="max-width: 1px" :title="data?.header">
          <ScrollText :start-on-hover="true" :constant-speed="true" :speed="60" :pause-at-ends="2">
            {{ data?.header }}
          </ScrollText>
        </td>
        <td class="align-middle w-1 p-0">
          <i
            v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.header')])"
            class="pi pi-copy cursor-pointer text-xs"
            @click="copyToClipboard(data?.header)"
          ></i>
        </td>
      </tr>
      <tr v-if="data?.password">
        <td class="text-right font-semibold align-middle w-1/5 whitespace-nowrap p-0">
          {{ i18n.t('common.password') }}:
        </td>
        <td class="truncate align-middle w-4/5 px-2 py-0" style="max-width: 1px" :title="data?.password">
          <ScrollText :start-on-hover="true" :constant-speed="true" :speed="60" :pause-at-ends="2">
            {{ data?.password }}
          </ScrollText>
        </td>
        <td class="align-middle w-1 p-0">
          <i
            v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.password')])"
            class="pi pi-copy cursor-pointer text-xs"
            @click="copyToClipboard(data?.password)"
          ></i>
        </td>
      </tr>
      <tr v-if="data?.source">
        <td class="text-right font-semibold align-middle w-1/5 whitespace-nowrap p-0">
          {{ i18n.t('common.source') }}:
        </td>
        <td class="truncate align-middle w-4/5 px-2 py-0" style="max-width: 1px" :title="data?.source">
          <a v-if="data?.source.startsWith('http')" :href="data?.source" target="_blank">
            <ScrollText :start-on-hover="true" :constant-speed="true" :speed="60" :pause-at-ends="2">
              {{ data?.source }}
            </ScrollText>
          </a>
          <span v-else>{{ data?.source }}</span>
        </td>
        <td class="align-middle w-1 p-0">
          <i
            v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.source')])"
            class="pi pi-copy cursor-pointer text-xs"
            @click="copyToClipboard(data?.source)"
          ></i>
        </td>
      </tr>
      <tr v-if="data?.searchEngine">
        <td class="text-right font-semibold align-middle w-1/5 whitespace-nowrap p-0">
          {{ i18n.t('common.searchEngine') }}:
        </td>
        <td class="truncate align-middle w-4/5 px-2 py-0" style="max-width: 1px" :title="data?.searchEngine">
          <ScrollText :start-on-hover="true" :constant-speed="true" :speed="60" :pause-at-ends="2">
            {{ data?.searchEngine }}
          </ScrollText>
        </td>
        <td class="align-middle w-1 p-0">
          <i
            v-tooltip.left-start="i18n.t('common.copyXtoClipboard', [i18n.t('common.searchEngine')])"
            class="pi pi-copy cursor-pointer text-xs"
            @click="copyToClipboard(data?.searchEngine)"
          ></i>
        </td>
      </tr>
    </tbody>
  </table>
</template>

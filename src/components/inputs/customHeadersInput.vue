<script setup lang="ts">
import { Button, InputText, Message } from 'primevue'

import { i18n } from '#i18n'

const headers = defineModel<Array<{ name: string; value: string }>>({ default: () => [] })

const addHeader = () => headers.value.push({ name: '', value: '' })
const removeHeader = (index: number) => headers.value.splice(index, 1)

const isDuplicate = (index: number) =>
  headers.value.some(
    (h, i) => i !== index && h.name.trim() !== '' && h.name.trim() === headers.value[index].name.trim()
  )
</script>

<template>
  <div v-if="headers.length === 0" class="text-sm mb-2">
    {{ i18n.t('common.settings.customHeaders.empty') }}
  </div>
  <div v-for="(header, index) in headers" :key="index" class="mb-2">
    <div class="flex items-center gap-2">
      <InputText
        v-model="header.name"
        :placeholder="i18n.t('common.settings.customHeaders.name')"
        size="small"
        class="flex-1"
        autocomplete="off"
        type="text"
      />
      <InputText
        v-model="header.value"
        :placeholder="i18n.t('common.settings.customHeaders.value')"
        size="small"
        class="flex-1"
        autocomplete="off"
        type="text"
      />
      <Button icon="pi pi-trash" severity="danger" variant="text" size="small" @click="removeHeader(index)" />
    </div>
    <Message v-if="isDuplicate(index)" severity="warn" size="small" variant="simple">
      {{ i18n.t('common.settings.customHeaders.duplicateWarning') }}
    </Message>
  </div>
  <Button
    icon="pi pi-plus"
    :label="i18n.t('common.settings.customHeaders.add')"
    size="small"
    severity="secondary"
    @click="addHeader"
  />
</template>

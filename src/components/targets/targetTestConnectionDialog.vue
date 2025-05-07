<script setup lang="ts">
import { Button, Dialog, ProgressSpinner } from 'primevue'
import { Ref, ref, watch } from 'vue'

import { i18n } from '#i18n'
import * as targets from '@/services/targets'
import { generateErrorString } from '@/utils/stringUtilities'

const showTestConnectionDialog = defineModel('showTestConnectionDialog') as Ref<boolean>
const targetSettings = defineModel('targetSettings') as Ref<targets.TargetSettings>
const emit = defineEmits(['success', 'close'])

const testingConnection = ref(true)
const error = ref('')

watch(showTestConnectionDialog, async () => {
  if (showTestConnectionDialog.value) {
    try {
      await targets[targetSettings.value.type as targets.TargetType].testConnection(
        targetSettings.value as targets.TargetSettings
      )
      testingConnection.value = false
    } catch (e) {
      error.value = generateErrorString(e instanceof Error ? e.message : i18n.t('errors.unknownError'))
      testingConnection.value = false
    }
    emit('success', error.value === '' ? true : false)
  }
})

const close = () => {
  showTestConnectionDialog.value = false
  testingConnection.value = true
  error.value = ''
  emit('close')
}
</script>
<template>
  <Dialog v-model:visible="showTestConnectionDialog" modal :style="{ width: '25rem' }">
    <template #container="{}">
      <div class="flex flex-col px-4 py-4 gap-4 rounded">
        <div
          v-if="testingConnection"
          class="flex items-center justify-center gap-4 mt-4 mb-4"
          style="min-height: 100px"
        >
          <ProgressSpinner style="width: 60px; height: 60px" stroke-width="3" />
        </div>
        <div
          v-if="!testingConnection"
          class="flex flex-col items-center justify-center gap-4 mt-4 mb-4"
          style="height: 100px"
        >
          <i v-if="error === ''" class="pi pi-check-circle" style="font-size: 2.5rem; color: rgb(102, 187, 106)"></i>
          <i
            v-if="error != ''"
            class="pi pi-exclamation-triangle"
            style="font-size: 2.5rem; color: rgb(211, 47, 47)"
          ></i>
          <div v-if="error != ''" style="font-size: 120%">{{ error }}</div>
          <div v-if="error === ''" style="font-size: 120%">
            {{ generateErrorString(i18n.t('common.connectionSuccessfull')) }}
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <Button
            v-if="testingConnection"
            type="button"
            :label="i18n.t('common.cancel')"
            severity="secondary"
            @click="close()"
          ></Button>
          <Button v-if="!testingConnection" type="button" :label="i18n.t('common.ok')" @click="close()"></Button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

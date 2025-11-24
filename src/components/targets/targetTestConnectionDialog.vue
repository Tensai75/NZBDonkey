<script setup lang="ts">
import { Button, Dialog, ProgressSpinner } from 'primevue'
import { Ref, ref, toRaw, watch } from 'vue'

import { i18n } from '#i18n'
import { sendMessage } from '@/services/messengers/extensionMessenger'
import { TargetSettings } from '@/services/targets'
import { generateErrorString } from '@/utils/stringUtilities'

const showTestConnectionDialog = defineModel('showTestConnectionDialog') as Ref<boolean>
const targetSettings = defineModel('targetSettings') as Ref<TargetSettings>
const emit = defineEmits(['success', 'close'])

const testingConnection = ref(true)
const error = ref('')

watch(showTestConnectionDialog, async () => {
  if (showTestConnectionDialog.value) {
    let success: boolean
    try {
      success = await sendMessage('connectionTest', toRaw(targetSettings.value))
    } catch (e) {
      success = false
      error.value = generateErrorString(e instanceof Error ? e.message : String(e))
    }
    testingConnection.value = false
    emit('success', success)
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
          <div v-if="error != ''" class="text-center" style="font-size: 120%">
            {{ error }}
          </div>
          <div v-if="error === ''" class="text-center" style="font-size: 120%">
            {{ generateErrorString(i18n.t('common.connectionSuccessful')) }}
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

<script setup lang="ts">
import { FormField } from '@primevue/forms'
import { InputText, Message } from 'primevue'
import { Ref, watch } from 'vue'

import { i18n } from '#i18n'
import TestConnectionDialog from '@/components/targets/targetTestConnectionDialog.vue'
import { requiredResolver } from '@/services/resolvers'
import * as targets from '@/services/targets'

const targetSettings = defineModel('targetSettings') as Ref<
  targets.TargetSettings & { settings: targets.premiumize.Settings }
>
const showTestConnectionDialog = defineModel('testConnection') as Ref<boolean>
const connectionSuccessfull = defineModel('connectionSuccessfull') as Ref<boolean>
defineModel('showAdvancedSettings') as Ref<boolean>

watch(
  targetSettings.value.settings,
  () => {
    if (connectionSuccessfull.value) {
      connectionSuccessfull.value = false
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="flex items-center gap-4 mb-4 flex-auto">
    <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.apiKey') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('common.settings.apiKey')"
      :initial-value="targetSettings.settings.apiKey"
      :resolver="requiredResolver"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="targetSettings.settings.apiKey as string"
        class="w-full"
        size="small"
        autocomplete="off"
        type="text"
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
  </div>
  <TestConnectionDialog
    v-model:show-test-connection-dialog="showTestConnectionDialog"
    v-model:target-settings="targetSettings"
    @success="(value) => (connectionSuccessfull = value)"
  />
</template>

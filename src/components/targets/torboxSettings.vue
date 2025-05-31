<script setup lang="ts">
import { FormField } from '@primevue/forms'
import { InputText, Message, ToggleSwitch } from 'primevue'
import { Ref, watch } from 'vue'

import { i18n } from '#i18n'
import TestConnectionDialog from '@/components/targets/targetTestConnectionDialog.vue'
import { requiredResolver } from '@/services/resolvers'
import * as targets from '@/services/targets'

const targetSettings = defineModel('targetSettings') as Ref<
  targets.TargetSettings & { settings: targets.torbox.Settings }
>
const showTestConnectionDialog = defineModel('testConnection') as Ref<boolean>
const connectionSuccessful = defineModel('connectionSuccessful') as Ref<boolean>
defineModel('showAdvancedSettings') as Ref<boolean>

watch(
  targetSettings.value.settings,
  () => {
    if (connectionSuccessful.value) {
      connectionSuccessful.value = false
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
  <div class="flex items-center gap-4 mb-4">
    <label for="name" class="font-semibold w-24 text-right">{{
      i18n.t('settings.nzbFileTargets.asQueued.name')
    }}</label>
    <FormField
      :name="i18n.t('settings.nzbFileTargets.asQueued.name')"
      :initial-value="targetSettings.settings.as_queued"
      class="grid-row flex-auto"
    >
      <div class="flex items-center">
        <ToggleSwitch v-model="targetSettings.settings.as_queued as boolean" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.nzbFileTargets.asQueued.description') }}
        </label>
      </div>
    </FormField>
  </div>
  <TestConnectionDialog
    v-model:show-test-connection-dialog="showTestConnectionDialog"
    v-model:target-settings="targetSettings"
    @success="(value) => (connectionSuccessful = value)"
  />
</template>

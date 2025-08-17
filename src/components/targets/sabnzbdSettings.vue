<script setup lang="ts">
import { FormField } from '@primevue/forms'
import { InputText, Message, Select, ToggleSwitch } from 'primevue'
import { Ref, computed, watch } from 'vue'

import { i18n } from '#i18n'
import TimeoutInput from '@/components/inputs/timeoutInput.vue'
import TestConnectionDialog from '@/components/targets/targetTestConnectionDialog.vue'
import {
  relativePathResolver,
  requiredHostResolver,
  requiredPortResolver,
  requiredResolver,
} from '@/services/resolvers'
import * as targets from '@/services/targets'

const targetSettings = defineModel('targetSettings') as Ref<
  targets.TargetSettings & { settings: targets.sabnzbd.Settings }
>
const showTestConnectionDialog = defineModel('testConnection') as Ref<boolean>
const connectionSuccessful = defineModel('connectionSuccessful') as Ref<boolean>
defineModel('showAdvancedSettings') as Ref<boolean>

const schemeValues = ['http', 'https']
const schemeNames = {
  http: 'http://',
  https: 'https://',
}

const url = computed(() => {
  return (
    targetSettings.value.settings.scheme +
    '://' +
    targetSettings.value.settings.host +
    ':' +
    targetSettings.value.settings.port +
    (targetSettings.value.settings.basepath ? '/' + targetSettings.value.settings.basepath : '')
  )
})

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
  <div class="flex items-center gap-4 mt-4 mb-4 flex-auto">
    <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.scheme') }}</label>
    <Select
      v-model="targetSettings.settings.scheme"
      :options="schemeValues"
      option-label="scheme"
      class="w-64 md:w-100 max-w-64 md:max-w-min m-0 p-0"
      style="height: 40px; font-size: 14px; line-height: 24px; min-width: 100px"
    >
      <template #value="slotProps">
        <div v-if="schemeValues.includes(slotProps.value)" class="flex items-center">
          <div>
            {{ schemeNames[slotProps.value as keyof typeof schemeNames] }}
          </div>
        </div>
        <span v-else>
          {{ slotProps.placeholder }}
        </span>
      </template>
      <template #option="slotProps">
        <div class="flex items-center">
          <div>
            {{ schemeNames[slotProps.option as keyof typeof schemeNames] }}
          </div>
        </div>
      </template>
    </Select>
    <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.host') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('common.settings.host')"
      :initial-value="targetSettings.settings.host"
      :resolver="requiredHostResolver"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="targetSettings.settings.host as string"
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
  <div class="flex items-center gap-4 mb-4 flex-auto">
    <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.port') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('common.settings.port')"
      :initial-value="targetSettings.settings.port"
      :resolver="requiredPortResolver"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
      style="max-width: 100px"
    >
      <InputText
        id="name"
        v-model="targetSettings.settings.port as string"
        class="w-full"
        size="small"
        autocomplete="off"
        type="number"
        min="1"
        max="65535"
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
    <template v-if="showAdvancedSettings">
      <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.basepath') }}</label>
      <FormField
        v-slot="$field"
        :name="i18n.t('common.settings.basepath')"
        :initial-value="targetSettings.settings.basepath"
        :resolver="relativePathResolver"
        :validate-on-blur="true"
        :validate-on-value-update="true"
        :validate-on-mount="true"
        class="grid-row flex-auto"
      >
        <InputText
          id="name"
          v-model="targetSettings.settings.basepath as string"
          class="w-full"
          size="small"
          autocomplete="off"
          type="text"
        />
        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
          $field.error?.message
        }}</Message>
      </FormField>
    </template>
  </div>
  <div class="flex items-center gap-4 mb-4 flex-auto">
    <label for="name" class="font-semibold w-24 text-right">URL</label>
    <FormField name="URL" class="grid-row flex-auto" size="small">
      <InputText
        id="name"
        v-model="url as string"
        class="w-full"
        size="small"
        type="text"
        disabled
        style="height: 24px"
      />
    </FormField>
  </div>
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
  <div v-if="showAdvancedSettings" class="flex items-center gap-4 mb-4 flex-auto">
    <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.username') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('common.settings.username')"
      :initial-value="targetSettings.settings.basicAuthUsername"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="targetSettings.settings.basicAuthUsername as string"
        class="w-full"
        size="small"
        autocomplete="off"
        type="text"
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
    <label for="name" class="font-semibold text-right">{{ i18n.t('common.settings.password') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('common.settings.password')"
      :initial-value="targetSettings.settings.basicAuthPassword"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="targetSettings.settings.basicAuthPassword as string"
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
    <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.timeout.title') }}</label>
    <TimeoutInput v-model="targetSettings.settings.timeout" />
  </div>
  <div class="flex items-center gap-4 mb-4">
    <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.addAsPaused.title') }}</label>
    <FormField
      :name="i18n.t('common.settings.addAsPaused.title')"
      :initial-value="targetSettings.settings.addPaused"
      class="grid-row flex-auto"
    >
      <div class="flex items-center">
        <ToggleSwitch v-model="targetSettings.settings.addPaused" />
        <label class="label-text pl-4">
          {{ i18n.t('common.settings.addAsPaused.description') }}
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

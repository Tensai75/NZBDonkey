<script setup lang="ts">
import { FormField } from '@primevue/forms'
import { InputText, Message, ToggleSwitch } from 'primevue'
import { Ref } from 'vue'

import { i18n } from '#i18n'
import { relativePathResolver } from '@/services/resolvers'
import * as targets from '@/services/targets'

const targetSettings = defineModel('targetSettings') as Ref<
  targets.TargetsSettings & { settings: targets.download.Settings }
>
defineModel('testConnection') as Ref<boolean>
defineModel('connectionSuccessfull') as Ref<boolean>
defineModel('showAdvancedSettings') as Ref<boolean>
</script>

<template>
  <div class="flex items-center gap-4 mt-4 mb-4 flex-auto">
    <label for="name" class="font-semibold w-36 text-right">{{
      i18n.t('settings.nzbFileTargets.download.path')
    }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('settings.nzbFileTargets.download.path')"
      :initial-value="targetSettings.settings.defaultPath"
      :resolver="relativePathResolver"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="targetSettings.settings.defaultPath as string"
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
  <div class="flex items-center gap-4 pt-4 mb-4">
    <label for="name" class="font-semibold w-36 text-right">{{
      i18n.t('settings.nzbFileTargets.download.saveAs.title')
    }}</label>
    <FormField
      :name="i18n.t('settings.nzbFileTargets.download.saveAs.title')"
      :initial-value="targetSettings.settings.saveAs"
      class="grid-row flex-auto"
    >
      <div class="flex items-center">
        <ToggleSwitch v-model="targetSettings.settings.saveAs" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.nzbFileTargets.download.saveAs.description') }}
        </label>
      </div>
    </FormField>
  </div>
</template>

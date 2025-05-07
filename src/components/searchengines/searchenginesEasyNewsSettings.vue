<script setup lang="ts">
import { FormField } from '@primevue/forms'
import { InputText, Message } from 'primevue'
import { Ref } from 'vue'

import { i18n } from '#i18n'
import { requiredResolver } from '@/services/resolvers'
import * as searchengines from '@/services/searchengines'

const engine = defineModel('settings') as Ref<
  searchengines.SearchEngine & { settings: searchengines.easyNewsEngine.Settings }
>
</script>

<template>
  <div class="flex items-center gap-4 mb-4">
    <label for="name" class="font-semibold w-24">{{ i18n.t('settings.searchEngines.engines.engine.title') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('settings.searchEngines.engines.engine.title')"
      :initial-value="engine.name"
      :resolver="requiredResolver"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="engine.name as string"
        class="w-full"
        size="small"
        autocomplete="off"
        type="text"
        disabled
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
  </div>
  <div class="flex items-center gap-4 mb-4 flex-auto">
    <label for="name" class="font-semibold w-24">{{ i18n.t('common.settings.username') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('common.settings.username')"
      :initial-value="engine.settings.username"
      :resolver="requiredResolver"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="engine.settings.username as string"
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
      :initial-value="engine.settings.password"
      :resolver="requiredResolver"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="engine.settings.password as string"
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
</template>

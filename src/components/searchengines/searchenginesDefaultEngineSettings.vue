<script setup lang="ts">
import { FormField, FormFieldResolverOptions } from '@primevue/forms'
import { Checkbox, InputNumber, InputText, Message, RadioButton } from 'primevue'
import { Ref } from 'vue'

import { i18n } from '#i18n'
import {
  requiredJSONPathResolver,
  requiredRegexpResolver,
  requiredResolver,
  requiredURLResolver,
} from '@/services/resolvers'
import * as searchengines from '@/services/searchengines'

const engine = defineModel('settings') as Ref<
  searchengines.SearchEngine & { settings: searchengines.defaultEngine.Settings }
>
const emit = defineEmits(['rerender'])

const searchPatternResolver = (values: FormFieldResolverOptions) => {
  if (engine.value.settings.responseType === 'html') {
    return requiredRegexpResolver(values)
  } else {
    return requiredJSONPathResolver(values)
  }
}
</script>

<template>
  <div class="flex items-center gap-4 mb-4">
    <label for="name" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.title')
    }}</label>
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
        :disabled="engine.isDefault"
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
  </div>
  <div class="flex items-center gap-4 mb-4">
    <label for="searchURL" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.searchURL')
    }}</label>

    <FormField
      v-slot="$field"
      :name="i18n.t('settings.searchEngines.engines.engine.searchURL')"
      :initial-value="engine.settings.searchURL"
      :resolver="requiredURLResolver"
      class="grid-row flex-auto"
    >
      <InputText
        id="searchURL"
        v-model="engine.settings.searchURL as string"
        class="w-full"
        size="small"
        autocomplete="off"
        :disabled="engine.isDefault"
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
  </div>
  <div class="flex items-center gap-4 mb-4">
    <label for="responseType" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.responseType')
    }}</label>
    <RadioButton
      v-model="engine.settings.responseType"
      input-id="responseTypeHTML"
      name="responseType"
      value="html"
      :disabled="engine.isDefault"
      @change="emit('rerender')"
    />
    <label for="parallel">HTML</label>
    <span class="w-4"></span>
    <RadioButton
      v-model="engine.settings.responseType"
      input-id="responseTypeJSON"
      name="responseType"
      value="json"
      :disabled="engine.isDefault"
      @change="emit('rerender')"
    />
    <label for="parallel">JSON</label>
  </div>
  <div class="flex items-center gap-4 mb-4">
    <label v-if="engine.settings.responseType == 'html'" for="searchPattern" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.searchPattern.html')
    }}</label>
    <label v-if="engine.settings.responseType == 'json'" for="searchPattern" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.searchPattern.json')
    }}</label>
    <FormField
      v-slot="$field"
      :name="
        engine.settings.responseType === 'html'
          ? i18n.t('settings.searchEngines.engines.engine.searchPattern.html')
          : i18n.t('settings.searchEngines.engines.engine.searchPattern.json')
      "
      :initial-value="engine.settings.searchPattern"
      :resolver="searchPatternResolver"
      class="grid-row flex-auto"
    >
      <InputText
        id="searchPattern"
        v-model="engine.settings.searchPattern as string"
        class="w-full"
        size="small"
        autocomplete="off"
        :disabled="engine.isDefault"
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>

    <label v-if="engine.settings.responseType == 'html'" for="searchGroup" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.searchGroup')
    }}</label>
    <InputNumber
      v-if="engine.settings.responseType == 'html'"
      v-model="engine.settings.searchGroup"
      :min="1"
      :max="9"
      input-id="horizontal-buttons"
      show-buttons
      button-layout="horizontal"
      :step="1"
      fluid
      size="small"
      style="width: 8rem"
      :disabled="engine.isDefault"
    >
      <template #incrementicon>
        <span class="pi pi-plus" />
      </template>
      <template #decrementicon>
        <span class="pi pi-minus" />
      </template>
    </InputNumber>
  </div>
  <div class="flex items-center gap-4 mb-4">
    <label for="downloadURL" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.downloadURL')
    }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('settings.searchEngines.engines.engine.downloadURL')"
      :initial-value="engine.settings.downloadURL"
      :resolver="requiredURLResolver"
      class="grid-row flex-auto"
    >
      <InputText
        id="downloadURL"
        v-model="engine.settings.downloadURL as string"
        class="w-full"
        size="small"
        autocomplete="off"
        :disabled="engine.isDefault"
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
  </div>
  <div class="flex items-center gap-4 mb-4">
    <label for="additionalSettings" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.additionalSettings.title')
    }}</label>
    <div class="flex items-center wrap gap-4">
      <div class="flex items-center gap-4">
        <Checkbox
          v-model="engine.settings.removeUnderscore"
          input-id="removeUnderscore"
          name="removeUnderscore"
          value="checked"
          :disabled="engine.isDefault"
        />
        <label for="ingredient1">{{
          i18n.t('settings.searchEngines.engines.engine.additionalSettings.removeUndersore')
        }}</label>
      </div>
      <div class="flex items-center gap-4">
        <Checkbox
          v-model="engine.settings.removeHyphen"
          input-id="removeHyphen"
          name="removeHyphen"
          value="checked"
          :disabled="engine.isDefault"
        />
        <label for="ingredient1">{{
          i18n.t('settings.searchEngines.engines.engine.additionalSettings.removeHyphen')
        }}</label>
      </div>
      <div class="flex items-center gap-4">
        <Checkbox
          v-model="engine.settings.setIntoQuotes"
          input-id="setIntoQuotes"
          name="setIntoQuotes"
          value="checked"
          :disabled="engine.isDefault"
        />
        <label for="ingredient1">{{
          i18n.t('settings.searchEngines.engines.engine.additionalSettings.setIntoQuotes')
        }}</label>
      </div>
    </div>
  </div>
</template>

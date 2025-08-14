<script setup lang="ts">
import { FormField, FormFieldResolverOptions } from '@primevue/forms'
import { Checkbox, InputNumber, InputText, Message, RadioButton, ToggleSwitch } from 'primevue'
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
    <label class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.nzbIdIdentifier')
    }}</label>
    <div class="flex items-center mb-2 min-w-32 w-full">
      <div class="flex flex-col gap-1 flex-auto min-w-32 w-full">
        <label v-if="engine.settings.responseType == 'html'" for="searchPattern" class="font-semibold w-full">
          {{ i18n.t('settings.searchEngines.engines.engine.searchPattern.html') }}
        </label>
        <label v-if="engine.settings.responseType == 'json'" for="searchPattern" class="font-semibold w-full">
          {{ i18n.t('settings.searchEngines.engines.engine.searchPattern.json') }}
        </label>
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
      </div>
      <div v-if="engine.settings.responseType == 'html'" class="flex flex-col gap-1 flex-auto ml-4">
        <label for="posterGroup" class="font-semibold min-w-32 w-32">{{
          i18n.t('settings.searchEngines.engines.engine.searchGroup')
        }}</label>
        <InputNumber
          v-model="engine.settings.posterGroup"
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
    </div>
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
      i18n.t('settings.searchEngines.engines.engine.groupByPoster.title')
    }}</label>
    <div class="flex flex-col gap-4 flex-auto">
      <div class="flex items-center">
        <ToggleSwitch id="groupByPoster" v-model="engine.settings.groupByPoster" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.searchEngines.engines.engine.groupByPoster.description') }}
        </label>
      </div>
    </div>
  </div>
  <div v-if="engine.settings.groupByPoster" class="flex items-center gap-4 mb-4">
    <label for="additionalSettings" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.posterIdentifier')
    }}</label>
    <div class="flex items-center mb-2 min-w-32 w-full">
      <div class="flex flex-col gap-1 flex-auto min-w-32 w-full">
        <label v-if="engine.settings.responseType == 'html'" for="posterPattern" class="font-semibold w-full">
          {{ i18n.t('settings.searchEngines.engines.engine.posterPattern.html') }}
        </label>
        <label v-if="engine.settings.responseType == 'json'" for="posterPattern" class="font-semibold w-full">
          {{ i18n.t('settings.searchEngines.engines.engine.posterPattern.json') }}
        </label>
        <FormField
          v-slot="$field"
          :name="
            engine.settings.responseType === 'html'
              ? i18n.t('settings.searchEngines.engines.engine.posterPattern.html')
              : i18n.t('settings.searchEngines.engines.engine.posterPattern.json')
          "
          :initial-value="engine.settings.posterPattern"
          :resolver="searchPatternResolver"
          class="grid-row flex-auto"
        >
          <InputText
            id="posterPattern"
            v-model="engine.settings.posterPattern as string"
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
      <div v-if="engine.settings.responseType == 'html'" class="flex flex-col gap-1 flex-auto ml-4">
        <label for="posterGroup" class="font-semibold min-w-32 w-32">{{
          i18n.t('settings.searchEngines.engines.engine.searchGroup')
        }}</label>
        <InputNumber
          v-model="engine.settings.posterGroup"
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
    </div>
  </div>
  <div
    v-if="engine.settings.groupByPoster && engine.settings.responseType == 'html'"
    class="flex items-center gap-4 mb-4"
  >
    <label for="additionalSettings" class="font-semibold min-w-32 w-32">{{
      i18n.t('settings.searchEngines.engines.engine.resultSelector')
    }}</label>
    <div class="flex flex-auto min-w-32 w-full">
      <FormField
        v-slot="$field"
        :name="i18n.t('settings.searchEngines.engines.engine.resultSelector')"
        :initial-value="engine.settings.resultSelector"
        :resolver="requiredResolver"
        class="grid-row flex-auto"
      >
        <InputText
          id="resultSelector"
          v-model="engine.settings.resultSelector as string"
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

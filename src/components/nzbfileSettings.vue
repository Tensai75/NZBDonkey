<script setup lang="ts">
import { Fieldset, Select, Slider, Tag, ToggleSwitch } from 'primevue'
import { Ref } from 'vue'

import { i18n } from '#i18n'
import { Settings as NZBFileSettings, useSettings as useNZBFileSettings } from '@/services/nzbfile/'

const settings: Ref<NZBFileSettings> = await useNZBFileSettings()

const processTitleValues = ['spaces', 'dots']
const processTitleNames = {
  dots: i18n.t('settings.processing.processTitle.spaces') + ' [NZB Datei Name -> NZB.Datei.Name]',
  spaces: i18n.t('settings.processing.processTitle.dots') + ' [NZB.Datei.Name -> NZB Datei Name]',
}
</script>

<template>
  <div class="mb-4">
    <Fieldset :legend="i18n.t('menu.settings.nzbFile')">
      <div class="flex items-center mb-4">
        <ToggleSwitch v-model="settings.processTitle" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.processing.processTitle.description') }}
        </label>
      </div>

      <div v-if="settings.processTitle" class="flex items-center mb-4">
        <Select
          v-model="settings.processTitleType"
          :options="processTitleValues"
          option-label="name"
          class="w-full md:w-100 max-w-full md:max-w-min m-0 p-0"
        >
          <template #value="slotProps">
            <div v-if="processTitleValues.includes(slotProps.value)" class="flex items-center">
              <div>
                {{ processTitleNames[slotProps.value as keyof typeof processTitleNames] }}
              </div>
            </div>
            <span v-else>
              {{ slotProps.placeholder }}
            </span>
          </template>
          <template #option="slotProps">
            <div class="flex items-center">
              <div>
                {{ processTitleNames[slotProps.option as keyof typeof processTitleNames] }}
              </div>
            </div>
          </template>
        </Select>
        <!-- label class="label-text pl-4">
        {{ i18n.t("settings.processing.processTitle.description") }}
      </label -->
      </div>

      <div class="flex items-center mb-4">
        <ToggleSwitch v-model="settings.addPasswordToFilename" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.processing.addPasswordToFilename') }}
        </label>
      </div>

      <div class="flex items-center mb-4">
        <ToggleSwitch v-model="settings.addTitle" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.processing.addTitle') }}
        </label>
      </div>

      <div class="flex items-center mb-4">
        <ToggleSwitch v-model="settings.addPassword" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.processing.addPassword') }}
        </label>
      </div>
    </Fieldset>
  </div>
  <div class="mb-4">
    <Fieldset :legend="i18n.t('settings.processing.completeness.title')">
      <div class="flex items-center mb-4">
        <ToggleSwitch v-model="settings.fileCheck" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.processing.completeness.fileCheck') }}
        </label>
      </div>
      <div v-if="settings.fileCheck" class="flex items-center mb-4">
        <Slider v-model="settings.fileCheckThreshold as number" class="w-28" :min="1" :max="20" />
        <Tag
          :value="settings.fileCheckThreshold"
          class="ml-4 py-0"
          style="font-weight: normal !important; color: white !important"
        ></Tag>
        <label class="label-text pl-4">
          {{ i18n.t('settings.processing.completeness.fileCheckThreshold') }}
        </label>
      </div>

      <div class="flex items-center">
        <ToggleSwitch v-model="settings.segmentCheck" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.processing.completeness.segmentCheck') }}
        </label>
      </div>
      <div v-if="settings.segmentCheck" class="flex items-center mt-4">
        <Slider v-model="settings.segmentCheckThreshold as number" class="w-28" :min="1" :max="20" />
        <Tag
          :value="settings.segmentCheckThreshold"
          class="ml-4 py-0"
          style="font-weight: normal !important; color: white !important"
          >{{ settings.segmentCheckThreshold }}%</Tag
        >
        <label class="label-text pl-4">
          {{ i18n.t('settings.processing.completeness.segmentCheckThreshold') }}
        </label>
      </div>
    </Fieldset>
  </div>
</template>

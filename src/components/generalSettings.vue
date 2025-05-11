<script setup lang="ts">
import { Button, Fieldset, Select, ToggleSwitch } from 'primevue'
import { Ref, ref } from 'vue'

import { i18n } from '#i18n'
import TagInput from '@/components/inputs/tagInput.vue'
import LogDialog from '@/components/logger/logDialog.vue'
import { Settings as GeneralSettings, useSettings as useGeneralSettings } from '@/services/general'

const settings: Ref<GeneralSettings> = await useGeneralSettings()

const logType = ref('')

const notificationValues = [0, 1, 2, 3]
const notificationNames = [
  i18n.t('settings.general.notifications.showAll'),
  i18n.t('settings.general.notifications.showSuccess'),
  i18n.t('settings.general.notifications.showError'),
  i18n.t('settings.general.notifications.showNothing'),
]
</script>

<template>
  <div class="mb-4">
    <Fieldset :legend="i18n.t('settings.general.catchLinks.title')">
      <div class="flex items-center">
        <ToggleSwitch v-model="settings.catchLinks" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.general.catchLinks.description') }}
        </label>
      </div>
    </Fieldset>
  </div>
  <div class="mb-4">
    <Fieldset :legend="i18n.t('settings.general.showNzbDialog.title')">
      <div class="flex items-center mt-4">
        <ToggleSwitch v-model="settings.catchLinksShowDialog" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.general.showNzbDialog.description') }}
        </label>
      </div>
    </Fieldset>
  </div>
  <div class="mb-4">
    <div class="mb-4">
      <Fieldset :legend="i18n.t('settings.general.notifications.title')" class="flex align-middle">
        <div class="flex items-center">
          <Select
            v-model="settings.notifications"
            :options="notificationValues"
            option-label="name"
            class="w-full md:w-56 m-0 p-0"
          >
            <template #value="slotProps">
              <div v-if="notificationValues.includes(slotProps.value)" class="flex items-center">
                <div>
                  {{ notificationNames[slotProps.value] }}
                </div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template #option="slotProps">
              <div class="flex items-center">
                <div>{{ notificationNames[slotProps.index] }}</div>
              </div>
            </template>
          </Select>
          <label class="label-text pl-4">
            {{ i18n.t('settings.general.notifications.description') }}
          </label>
        </div>
      </Fieldset>
    </div>
    <div class="mb-4">
      <Fieldset :legend="i18n.t('settings.general.selectText.searchKeyTitle')" class="flex align-middle">
        <div class="flex items-center taginput">
          <label class="label-text font-bold min-w-20 max-w-20 w-20 mr-4">
            {{ i18n.t('common.title') }}
          </label>
          <TagInput
            v-model="settings.textSelection.title"
            :placeholder="i18n.t('settings.general.selectText.enterSearchKey')"
            tag-bg-color="var(--p-primary-400)"
            tag-text-color="var(--p-primary-contrast-color)"
          />
        </div>
        <div class="flex items-center taginput">
          <label class="label-text font-bold min-w-20 max-w-20 w-20 mr-4">
            {{ i18n.t('common.header') }}
          </label>
          <TagInput
            v-model="settings.textSelection.header"
            :placeholder="i18n.t('settings.general.selectText.enterSearchKey')"
            tag-bg-color="var(--p-primary-400)"
            tag-text-color="var(--p-primary-contrast-color)"
          />
        </div>
        <div class="flex items-center taginput">
          <label class="label-text font-bold min-w-20 max-w-20 w-20 mr-4">
            {{ i18n.t('common.password') }}
          </label>
          <TagInput
            v-model="settings.textSelection.password"
            :placeholder="i18n.t('settings.general.selectText.enterSearchKey')"
            tag-bg-color="var(--p-primary-400)"
            tag-text-color="var(--p-primary-contrast-color)"
          />
        </div>
      </Fieldset>
    </div>
    <Fieldset :legend="i18n.t('settings.general.logs.title')" class="flex align-middle">
      <div class="flex items-center mb-4">
        <ToggleSwitch v-model="settings.nzbLog" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.general.logs.nzbLog') }}
        </label>
        <Button
          class="ml-8"
          size="small"
          severity="secondary"
          :label="i18n.t('menu.logger.nzbLog.title')"
          @click="logType = 'nzbLog'"
        />
      </div>
      <div class="flex items-center">
        <ToggleSwitch v-model="settings.debug" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.general.logs.debugLog') }}
        </label>
        <Button
          class="ml-8"
          size="small"
          severity="secondary"
          :label="i18n.t('menu.logger.debugLog.title')"
          @click="logType = 'debugLog'"
        />
      </div>
    </Fieldset>
  </div>
  <LogDialog v-if="logType != ''" :log-type="logType" @close="logType = ''" />
</template>

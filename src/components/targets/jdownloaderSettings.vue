<script setup lang="ts">
import { FormField } from '@primevue/forms'
import { InputText, Message, Select, ToggleSwitch } from 'primevue'
import { Ref, ref } from 'vue'

import { i18n } from '#i18n'
import TestConnectionDialog from '@/components/targets/targetTestConnectionDialog.vue'
import { requiredResolver } from '@/services/resolvers'
import * as targets from '@/services/targets'

const targetSettings = defineModel('targetSettings') as Ref<
  targets.TargetSettings & { settings: targets.jdownloader.Settings }
>
const showTestConnectionDialog = defineModel('testConnection') as Ref<boolean>
const connectionSuccessfull = defineModel('connectionSuccessfull') as Ref<boolean>
defineModel('showAdvancedSettings') as Ref<boolean>
const emit = defineEmits(['rerender'])
const deviceIDs = ref(new Array<string>())
getDeviceIDs()

function deviceListResolver({ name, value }: { name?: string; value?: string }) {
  const errors = []
  if (connectionSuccessfull.value) {
    if (targetSettings.value.settings.devices.length > 0) {
      errors.push(...requiredResolver({ name, value }).errors)
    } else {
      errors.push({ message: i18n.t('validation.noJDDevices') })
    }
  }
  return { errors }
}

async function getJDownlaoderDevices(value: boolean) {
  if (value) {
    targetSettings.value.settings.devices = await targets.jdownloader.getDevices(targetSettings.value)
    getDeviceIDs()
    if (!targetSettings.value.settings.devices.find((device) => device.id === targetSettings.value.settings.device)) {
      targetSettings.value.settings.device = ''
    }
    connectionSuccessfull.value = value
  } else {
    connectionSuccessfull.value = value
  }
}

function getDeviceIDs() {
  deviceIDs.value = new Array<string>()
  targetSettings.value.settings.devices.forEach((device) => {
    deviceIDs.value.push(device.id)
  })
}
</script>

<template>
  <div class="flex items-center gap-4 mb-4 flex-auto">
    <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.email') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('common.settings.email')"
      :initial-value="targetSettings.settings.username"
      :resolver="requiredResolver"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="targetSettings.settings.username as string"
        class="w-full"
        size="small"
        autocomplete="off"
        type="text"
        @change="connectionSuccessfull = false"
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
    <label for="name" class="font-semibold text-right">{{ i18n.t('common.settings.password') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('common.settings.password')"
      :initial-value="targetSettings.settings.password"
      :resolver="requiredResolver"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <InputText
        id="name"
        v-model="targetSettings.settings.password as string"
        class="w-full"
        size="small"
        autocomplete="off"
        type="text"
        @change="connectionSuccessfull = false"
      />
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
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
  <div class="flex items-center gap-4 mt-4 mb-4 flex-auto">
    <label for="name" class="font-semibold w-24 text-right">{{ i18n.t('common.settings.device') }}</label>
    <FormField
      v-slot="$field"
      :name="i18n.t('common.settings.device')"
      :initial-value="targetSettings.settings.device"
      :resolver="deviceListResolver"
      :validate-on-blur="true"
      :validate-on-value-update="true"
      :validate-on-mount="true"
      class="grid-row flex-auto"
    >
      <Select
        v-model="targetSettings.settings.device"
        :options="deviceIDs"
        option-label="device"
        :disabled="!connectionSuccessfull && targetSettings.settings.devices.length === 0"
        class="w-64 md:w-100 max-w-64 md:max-w-min m-0 p-0"
        style="height: 40px; font-size: 14px; line-height: 24px; min-width: 100px"
      >
        <template #value="slotProps">
          <div
            v-if="targetSettings.settings.devices.find((device) => device.id === slotProps.value)"
            class="flex items-center"
          >
            <div>
              {{ targetSettings.settings.devices.find((device) => device.id === slotProps.value)?.name }}
            </div>
          </div>
          <span v-else>
            {{ slotProps.placeholder }}
          </span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center">
            <div>
              {{ targetSettings.settings.devices.find((device) => device.id === slotProps.option)?.name }}
            </div>
          </div>
        </template>
      </Select>
      <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
        $field.error?.message
      }}</Message>
    </FormField>
  </div>
  <TestConnectionDialog
    v-model:show-test-connection-dialog="showTestConnectionDialog"
    v-model:target-settings="targetSettings"
    @success="(value) => getJDownlaoderDevices(value)"
    @close="emit('rerender')"
  />
</template>

<script setup lang="ts">
import { Form, FormField } from '@primevue/forms'
import { Button, Dialog, InputText, Message } from 'primevue'
import { useConfirm } from 'primevue/useconfirm'
import { PropType, ref, toRaw, watch } from 'vue'

import { i18n } from '#i18n'
import CategoriesSettings from '@/components/categories/categoriesSettings.vue'
import NZBDonkeyLogo from '@/components/nzbdonkeyLogo.vue'
import DownloadSettings from '@/components/targets/downloadSettings.vue'
import JDownloaderSettings from '@/components/targets/jdownloaderSettings.vue'
import NzbgetSettings from '@/components/targets/nzbgetSettings.vue'
import PremiumizeSettings from '@/components/targets/premiumizeSettings.vue'
import SabnzbdSettings from '@/components/targets/sabnzbdSettings.vue'
import SynologySettings from '@/components/targets/synologySettings.vue'
import ChooseType from '@/components/targets/targetChooseDialog.vue'
import { requiredResolver } from '@/services/resolvers'
import * as targets from '@/services/targets'

const props = defineProps({
  settings: {
    type: Object as PropType<targets.TargetsSettings>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})
const emit = defineEmits(['save', 'close'])

// default is add
const isAdd = ref(true)
const title = ref(i18n.t('settings.nzbFileTargets.addDialog'))
const targetSettings = ref(structuredClone(targets.download.defaultSettings))
const targetHasAdvancedSettings = ref(false)
const targetHasConnectionTest = ref(false)
const targetCanHaveCategories = ref(false)
const targetDefaultName = ref(targetSettings.value.name)

const confirm = useConfirm()
const rerenderKey = ref(0)
const showAdvancedSettings = ref(false)
const testConnection = ref(false)
const connectionSuccessfull = ref(false)
const stage = ref(0)
const lastStage = ref(0)

if (props.settings.targets[props.index]) {
  isAdd.value = false
  title.value = i18n.t('settings.nzbFileTargets.editDialog')
  setTargetSettings(structuredClone(toRaw(props.settings.targets[props.index])))
}

function setTargetSettings(settings: targets.TargetSettings) {
  targetSettings.value = settings
  targetHasAdvancedSettings.value = targets[targetSettings.value.type as targets.TargetType].hasAdvancedSettings
  targetHasConnectionTest.value = targets[targetSettings.value.type as targets.TargetType].hasConnectionTest
  targetCanHaveCategories.value = targets[targetSettings.value.type as targets.TargetType].canHaveCategories
  connectionSuccessfull.value = !targetHasConnectionTest.value
  targetDefaultName.value = targetSettings.value.name
  stage.value++
  rerenderKey.value++
}

function setTargetType(type: targets.TargetType) {
  setTargetSettings(structuredClone(targets[type].defaultSettings))
}

watch(stage, () => {
  if (stage.value === 2) {
    if (!targetCanHaveCategories.value) {
      if (lastStage.value < stage.value) stage.value++
      else stage.value--
    }
  }
  if (stage.value === 3) {
    if (isAdd.value) {
      if ('host' in targetSettings.value.settings && targetSettings.value.settings.host) {
        targetSettings.value.name = targetDefaultName.value + ` (${targetSettings.value.settings.host})`
      } else {
        if (targetSettings.value.type === 'download') {
          targetSettings.value.name =
            targetDefaultName.value +
            ((targetSettings.value.settings as targets.download.Settings).defaultPath !== ''
              ? ` (${(targetSettings.value.settings as targets.download.Settings).defaultPath})`
              : '')
        }
        if (targetSettings.value.type === 'jdownloader') {
          targetSettings.value.name =
            targetDefaultName.value +
            ` (${
              (targetSettings.value.settings as targets.jdownloader.Settings).devices.find(
                (device) => device.id === (targetSettings.value.settings as targets.jdownloader.Settings).device
              )?.name || ''
            })`
        }
      }
    }
  }
  lastStage.value = stage.value
})

function confirmAdvancedSettings() {
  confirm.require({
    message: i18n.t('settings.common.confirmAdvancedSettings.message'),
    header: i18n.t('settings.common.confirmAdvancedSettings.header'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: i18n.t('common.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: i18n.t('common.ok'),
      severity: 'danger',
    },
    accept: () => {
      showAdvancedSettings.value = true
    },
    reject: () => {
      // void
    },
  })
}
</script>

<template>
  <Form
    v-slot="$form"
    :key="rerenderKey"
    :validate-on-blur="true"
    :validate-on-value-update="true"
    :validate-on-mount="true"
  >
    <Dialog
      :visible="true"
      :closable="false"
      modal
      :header="title"
      style="width: 55rem; max-width: 55rem; height: fit-content; max-height: 100%"
    >
      <template #header>
        <div class="inline-flex items-center justify-center gap-2">
          <NZBDonkeyLogo size="32" />
          <img v-if="stage > 0" :src="'/img/' + targetSettings.type + '.png'" style="height: 32px" />
          <span class="font-bold whitespace-nowrap text-lg">{{ title }}</span>
        </div>
      </template>

      <ChooseType v-if="isAdd && stage === 0" @type="(type) => setTargetType(type)"></ChooseType>
      <div v-if="stage === 1">
        <DownloadSettings
          v-if="targetSettings.type === 'download'"
          v-model:target-settings="targetSettings"
          v-model:test-connection="testConnection"
          v-model:connection-successfull="connectionSuccessfull"
          v-model:show-advanced-settings="showAdvancedSettings"
        />
        <NzbgetSettings
          v-if="targetSettings.type === 'nzbget'"
          v-model:target-settings="targetSettings"
          v-model:test-connection="testConnection"
          v-model:connection-successfull="connectionSuccessfull"
          v-model:show-advanced-settings="showAdvancedSettings"
        />
        <SabnzbdSettings
          v-if="targetSettings.type === 'sabnzbd'"
          v-model:target-settings="targetSettings"
          v-model:test-connection="testConnection"
          v-model:connection-successfull="connectionSuccessfull"
          v-model:show-advanced-settings="showAdvancedSettings"
        />
        <SynologySettings
          v-if="targetSettings.type === 'synology'"
          v-model:target-settings="targetSettings"
          v-model:test-connection="testConnection"
          v-model:connection-successfull="connectionSuccessfull"
          v-model:show-advanced-settings="showAdvancedSettings"
        />
        <PremiumizeSettings
          v-if="targetSettings.type === 'premiumize'"
          v-model:target-settings="targetSettings"
          v-model:test-connection="testConnection"
          v-model:connection-successfull="connectionSuccessfull"
          v-model:show-advanced-settings="showAdvancedSettings"
        />
        <JDownloaderSettings
          v-if="targetSettings.type === 'jdownloader'"
          v-model:target-settings="targetSettings"
          v-model:test-connection="testConnection"
          v-model:connection-successfull="connectionSuccessfull"
          v-model:show-advanced-settings="showAdvancedSettings"
          @rerender="rerenderKey++"
        />
      </div>
      <CategoriesSettings v-if="stage === 2 && targetCanHaveCategories" v-model:target-settings="targetSettings" />
      <div v-if="stage === 3" class="flex items-center gap-4 mt-4 mb-4 flex-auto">
        <label for="name" class="font-semibold w-36 text-right">{{ i18n.t('settings.common.name') }}</label>
        <FormField
          v-slot="$field"
          :name="i18n.t('settings.common.name')"
          :initial-value="targetSettings.name"
          :resolver="requiredResolver"
          class="grid-row flex-auto"
        >
          <InputText
            id="name"
            v-model="targetSettings.name as string"
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
      <template #footer>
        <div class="flex justify-between gap-4 w-full">
          <div>
            <Button
              v-if="targetHasAdvancedSettings && stage === 1"
              type="button"
              :label="
                showAdvancedSettings
                  ? i18n.t('settings.common.confirmAdvancedSettings.hide')
                  : i18n.t('settings.common.confirmAdvancedSettings.show')
              "
              severity="warn"
              variant="text"
              raised
              @click="showAdvancedSettings ? (showAdvancedSettings = !showAdvancedSettings) : confirmAdvancedSettings()"
            ></Button>
          </div>
          <div class="flex justify-end gap-4">
            <Button
              v-if="(isAdd && stage > 0) || stage > 1"
              type="button"
              :label="i18n.t('common.back')"
              severity="secondary"
              @click="stage--"
            ></Button>
            <Button type="button" :label="i18n.t('common.cancel')" severity="secondary" @click="emit('close')"></Button>
            <Button
              v-if="!connectionSuccessfull && stage === 1"
              type="button"
              :label="i18n.t('settings.nzbFileTargets.testConnection')"
              :disabled="!$form.valid"
              @click="testConnection = true"
            ></Button>
            <Button
              v-if="(connectionSuccessfull && stage === 1) || stage === 2"
              type="button"
              :label="i18n.t('common.next')"
              :disabled="!$form.valid"
              @click="stage++"
            ></Button>
            <Button
              v-if="stage === 3"
              type="button"
              :label="i18n.t('common.save')"
              :disabled="!$form.valid"
              @click="emit('save', targetSettings)"
            ></Button>
          </div>
        </div>
      </template>
    </Dialog>
  </Form>
</template>

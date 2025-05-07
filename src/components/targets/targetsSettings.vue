<script setup lang="ts">
import { Button, Column, DataTable, Fieldset, RadioButton, ToggleSwitch } from 'primevue'
import { useConfirm } from 'primevue/useconfirm'
import { ref, Ref, watch } from 'vue'

import { i18n } from '#i18n'
import EditTargetDialog from '@/components/targets/targetEditDialog.vue'
import { TargetsSettings, useSettings as useTargetsSettings } from '@/services/targets'

const settings: Ref<TargetsSettings> = await useTargetsSettings()

const confirm = useConfirm()

const setDefaultTarget = (index: number) => {
  settings.value.targets.forEach((target, targetIndex) => {
    target.isActive = index === targetIndex
  })
}

const confirmDeleteTarget = (index: number) => {
  confirm.require({
    message: i18n.t('settings.nzbFileTargets.confirmDelete.message', [settings.value.targets[index].name]),
    header: i18n.t('settings.nzbFileTargets.confirmDelete.header'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: i18n.t('common.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: i18n.t('common.delete'),
      severity: 'danger',
    },
    accept: () => {
      settings.value.targets.splice(index, 1)
      if (!settings.value.targets.find((target) => target.isActive)) {
        settings.value.targets[0].isActive = true
      }
    },
    reject: () => {
      // void
    },
  })
}

const showEditTargetDialog = ref(false)
const targetIndex = ref(0)

const showEditDialog = (index: number) => {
  targetIndex.value = index
  showEditTargetDialog.value = true
}

const showAddDialog = () => {
  targetIndex.value = settings.value.targets.length
  showEditTargetDialog.value = true
}

watch(
  settings,
  () => {
    if (!settings.value.allowMultipleTargets) {
      let activeTarget = false
      settings.value.targets.forEach((target) => {
        if (target.isActive && !activeTarget) {
          activeTarget = true
        } else if (target.isActive && activeTarget) {
          target.isActive = false
        }
      })
    }
  },
  { deep: true }
)
</script>

<template>
  <Fieldset :legend="i18n.t('menu.settings.nzbFileTargets')">
    <div class="flex items-center">
      <div style="margin-bottom: 1.5rem">
        <ToggleSwitch v-model="settings.allowMultipleTargets" :disabled="settings.targets.length < 2" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.nzbFileTargets.allowMultipleTargets.description') }}
        </label>
      </div>
    </div>
    <DataTable :value="settings.targets" table-style="" size="small">
      <Column
        v-if="settings.allowMultipleTargets"
        field="active"
        :header="i18n.t('settings.nzbFileTargets.active')"
        header-style="width: 5%"
      >
        <template #body="slotProps">
          <input
            v-model="slotProps.data.isActive"
            type="checkbox"
            inputId="active"
            name="active"
            :value="true"
            style="zoom: 1.5; margin-top: 2px"
            :disabled="slotProps.data.isActive && settings.targets.filter((target) => target.isActive).length === 1"
          />
        </template>
      </Column>
      <Column
        v-if="!settings.allowMultipleTargets"
        field="isActive"
        :header="i18n.t('settings.nzbFileTargets.defaultTarget.title')"
        header-style="width: 5%"
      >
        <template #body="slotProps">
          <RadioButton
            v-model="slotProps.data.isActive"
            input-id="isActive"
            name="isActive"
            :value="true"
            @click="setDefaultTarget(slotProps.index)"
          />
        </template>
      </Column>
      <Column
        field="type"
        :header="i18n.t('settings.nzbFileTargets.type')"
        header-style="width: 48px; justify-content: center;"
      >
        <template #body="slotProps">
          <span><img :src="'/img/' + slotProps.data.type + '.png'" :alt="slotProps.data.type" /></span>
        </template>
      </Column>
      <Column field="name" :header="i18n.t('settings.common.name')" header-style="width: auto"></Column>
      <Column header-style="width: 1%; padding-right: 0px">
        <template #body="slotProps">
          <Button
            v-if="!(!settings.allowMultipleTargets && slotProps.data.isActive) && settings.targets.length != 1"
            icon="pi pi-trash"
            variant="outlined"
            raised
            size="small"
            rounded
            severity="danger"
            @click="confirmDeleteTarget(slotProps.index)"
          />
        </template>
      </Column>
      <Column header-style="width: 1%">
        <template #body="slotProps">
          <Button
            :icon="'pi pi-pencil'"
            variant="outlined"
            raised
            size="small"
            rounded
            @click="showEditDialog(slotProps.index)"
          />
        </template>
      </Column>
      <template #empty>
        <div class="w-full text-center text-red-600 text-xl font-bold p-4">
          {{ i18n.t('settings.targets.noTargetsDefined') }}
        </div>
      </template>
      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xs">
            <template v-if="settings.allowMultipleTargets">
              <i class="pi pi-arrow-up"></i>
              {{ i18n.t('settings.nzbFileTargets.allowMultipleTargets.enabled') }}
            </template>
            <template v-else>
              <i class="pi pi-arrow-up"></i>
              {{ i18n.t('settings.nzbFileTargets.allowMultipleTargets.disabled') }}
            </template>
          </span>
          <span class="text-xs">
            <Button
              :label="i18n.t('settings.nzbFileTargets.addNewTarget')"
              raised
              variant="outlined"
              size="small"
              style="width: auto !important"
              @click="showAddDialog()"
            />
          </span>
        </div>
      </template>
    </DataTable>
  </Fieldset>
  <EditTargetDialog
    v-if="showEditTargetDialog"
    :settings="settings"
    :index="targetIndex"
    @save="
      (targetSettings) => {
        targetSettings.isActive = targetSettings.isActive
          ? targetSettings.isActive
          : settings.targets.length === 0
            ? true
            : false
        settings.targets[targetIndex] = targetSettings
        showEditTargetDialog = false
      }
    "
    @close="showEditTargetDialog = false"
  >
  </EditTargetDialog>
</template>

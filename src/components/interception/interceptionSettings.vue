<script setup lang="ts">
import { Button, Column, DataTable, Fieldset, ToggleSwitch, useConfirm } from 'primevue'
import { ref, Ref } from 'vue'

import EditInterceptionDomainDialog from '../../components/interception/editDomainDialog.vue'
import { Settings as InterceptionSettings, use as useInterceptionSettings } from '../../services/interception/settings'

import { i18n } from '#i18n'

const settings: Ref<InterceptionSettings> = await useInterceptionSettings()

const confirm = useConfirm()
const confirmDelete = (index: number) => {
  confirm.require({
    message: i18n.t('settings.interception.confirmDelete.message', [settings.value.domains[index].domain]),
    header: i18n.t('settings.interception.confirmDelete.header'),
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
      settings.value.domains.splice(index, 1)
    },
    reject: () => {
      // void
    },
  })
}

const showEditInterceptionDomainDialog = ref(false)
const domainIndex = ref(0)

const showEditDialog = (index: number) => {
  domainIndex.value = index
  showEditInterceptionDomainDialog.value = true
}

const showAddDialog = () => {
  domainIndex.value = settings.value.domains.length
  showEditInterceptionDomainDialog.value = true
}
</script>

<template>
  <div class="mb-4">
    <Fieldset :legend="i18n.t('settings.interception.enabled.title')">
      <div class="flex items-center">
        <ToggleSwitch v-model="settings.enabled" />
        <label class="label-text pl-4">
          {{ i18n.t('settings.interception.enabled.description') }}
        </label>
      </div>
    </Fieldset>
  </div>
  <div class="mb-4">
    <Fieldset v-if="settings.enabled" :legend="i18n.t('settings.interception.domains.title')">
      <div class="card">
        <DataTable :value="settings.domains" table-style="" size="small">
          <Column header-style="width: 1%" :reorderable-column="false" />
          <Column
            field="isActive"
            :header="i18n.t('settings.interception.domains.domain.active')"
            header-style="width: 1%"
          >
            <template #body="slotProps">
              <input
                v-model="slotProps.data.isActive"
                type="checkbox"
                inputId="isActive"
                name="isActive"
                :value="true"
                style="zoom: 1.5; margin-top: 2px"
              />
            </template>
          </Column>
          <Column header-style="width: 32px">
            <template #body="slotProps">
              <img
                alt="Favicon"
                :src="
                  slotProps.data.icon
                    ? slotProps.data.icon
                    : 'https://www.faviconextractor.com/favicon/' + slotProps.data.domain
                "
                style="width: 16px; height: 16px"
              />
            </template>
          </Column>
          <Column
            field="domain"
            :header="i18n.t('settings.interception.domains.domain.title')"
            header-style="width: auto"
          ></Column>
          <Column header-style="width: 1%; padding-right: 0px">
            <template #body="slotProps">
              <Button
                icon="pi pi-trash"
                variant="outlined"
                raised
                size="small"
                rounded
                severity="danger"
                @click="confirmDelete(slotProps.index)"
              />
            </template>
          </Column>
          <Column header-style="width: 1%">
            <template #body="slotProps">
              <Button
                icon="pi pi-pencil"
                variant="outlined"
                raised
                size="small"
                rounded
                @click="showEditDialog(slotProps.index)"
              />
            </template>
          </Column>
          <template #empty>
            <div class="w-full text-center p-4">
              {{ i18n.t('settings.interception.domains.noDomainsDefined') }}
            </div>
          </template>
          <template #footer>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs"></span>
              <span class="text-xs">
                <Button
                  :label="i18n.t('settings.interception.domains.addNewDomain')"
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
      </div>
    </Fieldset>
  </div>
  <EditInterceptionDomainDialog
    v-if="showEditInterceptionDomainDialog"
    :domains="settings.domains"
    :index="domainIndex"
    @close="showEditInterceptionDomainDialog = false"
    @save="
      (domain) => {
        settings.domains[domainIndex] = domain
        showEditInterceptionDomainDialog = false
      }
    "
  />
</template>

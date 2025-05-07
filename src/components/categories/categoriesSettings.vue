<script setup lang="ts">
import { FormField } from '@primevue/forms'
import { Button, Column, DataTable, Message, ProgressSpinner, RadioButton, ToggleSwitch, useConfirm } from 'primevue'
import { ref, Ref, toRaw } from 'vue'

import { i18n } from '#i18n'
import EditCategoryDialog from '@/components/categories/categoryEditDialog.vue'
import { categoryDefaultSettings, CategorySettings } from '@/services/categories'
import * as targets from '@/services/targets'
import { tryCatch } from '@/utils/generalUtilities'
import { generateErrorString } from '@/utils/stringUtilities'

const rerenderKey = ref(0)

const targetSettings = defineModel('targetSettings') as Ref<targets.TargetSettings>
const hasTargetCategories = targets[targetSettings.value.type].hasTargetCategories
const targetCategoriesLoaded = ref(false)
const targetCategoriesLoadingError = ref('')

if (hasTargetCategories) loadTargetCategories()
else targetCategoriesLoaded.value = true

async function loadTargetCategories() {
  targetCategoriesLoaded.value = false
  const usedCategories: CategorySettings[] = []
  const unusedCategories: CategorySettings[] = []
  const settingsCategories: CategorySettings[] = structuredClone(toRaw(targetSettings.value.categories.categories))
  let { data, error } = await tryCatch(targets[targetSettings.value.type].getCategories(targetSettings.value))
  if (data?.length === 0) {
    targetCategoriesLoadingError.value = generateErrorString(
      i18n.t('settings.nzbFileTargets.categories.noCategoriesDefinedInTarget', [targetSettings.value.name])
    )
    targetCategoriesLoadingError.value += '<br />'
    targetCategoriesLoadingError.value += generateErrorString(
      i18n.t('settings.nzbFileTargets.categories.pleaseDefineCategoriesInTarget', [targetSettings.value.name])
    )
    targetCategoriesLoaded.value = true
    return
  }
  if (error) {
    targetCategoriesLoadingError.value = i18n.t('settings.nzbFileTargets.categories.loadingError', [
      targetSettings.value.name,
    ])
    targetCategoriesLoadingError.value += ':<br />'
    targetCategoriesLoadingError.value += generateErrorString(error.message)
    targetCategoriesLoaded.value = true
    return
  }
  data?.forEach((name) => {
    const index: number = settingsCategories.findIndex((category) => category.name === name)
    if (index === -1) {
      let newCategory = structuredClone(categoryDefaultSettings)
      newCategory.name = name
      newCategory.isTargetCategory = true
      unusedCategories.push(newCategory)
    } else {
      usedCategories[index] = settingsCategories[index]
      usedCategories[index].isTargetCategory = true
    }
  })
  targetSettings.value.categories.categories = usedCategories.flat().concat(unusedCategories)
  checkDefault(targetSettings.value.categories.categories)
  targetCategoriesLoaded.value = true
}

function checkDefault(categories: CategorySettings[]): void {
  if (categories.length > 0 && categories.filter((category) => category.isDefault === true).length === 0) {
    categories[0].isDefault = true
  } else {
    let defaultFound = false
    categories.forEach((category) => {
      if (category.isDefault === true && !defaultFound) {
        defaultFound = true
      } else {
        category.isDefault = false
      }
    })
  }
}

function setDefault(index: number) {
  targetSettings.value.categories.categories.forEach((category: CategorySettings, categoryIndex: number) => {
    category.isDefault = index === categoryIndex
  })
  rerenderKey.value++
}

function onRowReorder({ value }: { value: CategorySettings[] }): void {
  targetSettings.value.categories.categories = value.map((category) => toRaw(category))
}

const confirm = useConfirm()
const confirmDelete = (index: number) => {
  confirm.require({
    message: i18n.t('settings.nzbFileTargets.categories.category.confirmDelete.message', [
      targetSettings.value.categories.categories[index].name,
    ]),
    header: i18n.t('settings.nzbFileTargets.categories.category.confirmDelete.header'),
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
      targetSettings.value.categories.categories.splice(index, 1)
    },
    reject: () => {
      // void
    },
  })
}

const editCategoryDialog = ref(false)
const editCategoryDialogIndex = ref(0)

const showEditDialog = (index: number) => {
  editCategoryDialogIndex.value = index
  editCategoryDialog.value = true
}

const showAddDialog = () => {
  editCategoryDialogIndex.value = targetSettings.value.categories.categories.length
  editCategoryDialog.value = true
}
</script>
<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-justify items-center gap-4 mt-4 mb-4 flex-auto">
      <label for="name" class="font-semibold w-36">{{
        i18n.t('settings.nzbFileTargets.categories.useCategories.title')
      }}</label>
      <FormField
        :name="i18n.t('settings.nzbFileTargets.categories.useCategories.title')"
        :initial-value="targetSettings.categories.useCategories"
        class="grid-row flex-auto"
      >
        <div class="flex items-center">
          <ToggleSwitch v-model="targetSettings.categories.useCategories" />
          <label class="label-text pl-4">
            {{ i18n.t('settings.nzbFileTargets.categories.useCategories.description') }}
          </label>
        </div>
      </FormField>
    </div>
    <template v-if="targetSettings.categories.useCategories">
      <div
        v-if="hasTargetCategories && !targetCategoriesLoaded"
        class="flex flex-col items-center justify-center gap-4 mt-4 mb-4"
        style="min-height: 100px"
      >
        <ProgressSpinner style="width: 60px; height: 60px" stroke-width="3" />
        <div class="text-center" style="font-size: 120%; width: 75%">
          {{
            generateErrorString(i18n.t('settings.nzbFileTargets.categories.loadingKategories', [targetSettings.name]))
          }}
        </div>
      </div>
      <div
        v-if="hasTargetCategories && targetCategoriesLoaded && targetCategoriesLoadingError != ''"
        class="flex flex-col items-center justify-center mt-4 mb-4"
        style="min-height: 100px"
      >
        <i class="pi pi-exclamation-triangle mb-4" style="font-size: 2.5rem; color: rgb(211, 47, 47)"></i>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div style="font-size: 120%; width: 75%" class="text-center" v-html="targetCategoriesLoadingError"></div>
        <Button class="mt-4" raised @click="loadTargetCategories()">Try again</Button>
      </div>
      <template v-if="targetCategoriesLoaded && targetCategoriesLoadingError === ''">
        <div class="flex flex-justify items-center gap-4 mt-4 mb-4 flex-auto">
          <label for="name" class="font-semibold w-36">{{
            i18n.t('settings.nzbFileTargets.categories.categorySelection.title')
          }}</label>
          <FormField
            :name="i18n.t('settings.nzbFileTargets.categories.categorySelection.title')"
            :initial-value="targetSettings.categories.type"
            class="grid-row flex-auto"
          >
            <div class="flex items-center gap-8">
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="targetSettings.categories.type"
                  input-id="automatic"
                  name="categorySelection"
                  value="automatic"
                />
                <label for="automatic">{{
                  i18n.t('settings.nzbFileTargets.categories.categorySelection.automatic')
                }}</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="targetSettings.categories.type"
                  input-id="manual"
                  name="categorySelection"
                  value="manual"
                />
                <label for="manual">{{ i18n.t('settings.nzbFileTargets.categories.categorySelection.manual') }}</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="targetSettings.categories.type"
                  input-id="fixed"
                  name="categorySelection"
                  value="fixed"
                />
                <label for="fixed">{{ i18n.t('settings.nzbFileTargets.categories.categorySelection.fixed') }}</label>
              </div>
            </div>
          </FormField>
        </div>
        <div class="flex items-center gap-4 mt-4 mb-4 grow w-full">
          <DataTable
            :key="rerenderKey"
            class="w-full"
            :value="targetSettings.categories.categories"
            scrollable
            scroll-height="flex"
            table-style=""
            size="small"
            @row-reorder="onRowReorder"
          >
            <Column
              v-if="targetSettings.categories.type === 'automatic'"
              row-reorder
              header-style="width: 1%"
              :reorderable-column="false"
            />
            <Column
              v-if="targetSettings.categories.type != 'fixed'"
              field="active"
              :header="i18n.t('settings.nzbFileTargets.categories.category.active')"
              header-style="width: 1%"
            >
              <template #body="slotProps">
                <ToggleSwitch v-model="slotProps.data.active" />
              </template>
            </Column>
            <Column
              v-if="targetSettings.categories.type === 'fixed' || targetSettings.categories.fallback === 'fixed'"
              field="isDefault"
              :header="i18n.t('settings.nzbFileTargets.categories.category.isDefault')"
              header-style="width: 10%"
            >
              <template #body="slotProps">
                <RadioButton
                  v-model="slotProps.data.isDefault"
                  input-id="isDefault"
                  name="isDefault"
                  :value="true"
                  @click="setDefault(slotProps.index)"
                />
              </template>
            </Column>
            <Column
              field="name"
              :header="i18n.t('settings.nzbFileTargets.categories.category.name')"
              header-style="width: auto"
            >
              <template #body="slotProps">
                <div class="flex flex-strech items-center" style="min-height: 36px">{{ slotProps.data.name }}</div>
              </template>
            </Column>
            <Column
              v-if="targetSettings.categories.type === 'automatic'"
              field="regexp"
              :header="i18n.t('settings.nzbFileTargets.categories.regexp')"
              header-style="width: auto"
            >
              <template #body="slotProps">
                <Message
                  v-if="slotProps.data.regexp === '' && slotProps.data.active"
                  severity="warn"
                  size="small"
                  variant="simple"
                  class="flex-auto"
                  >{{ i18n.t('settings.nzbFileTargets.categories.noRegexp') }}</Message
                >
                <div v-if="slotProps.data.regexp != ''">{{ slotProps.data.regexp }}</div>
              </template>
            </Column>
            <Column v-if="!hasTargetCategories" header-style="width: 1%">
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
            <Column
              v-if="(hasTargetCategories && targetSettings.categories.type === 'automatic') || !hasTargetCategories"
              header-style="width: 1%"
            >
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
                {{ i18n.t('settings.nzbFileTargets.categories.noCategoriesDefined') }}
              </div>
            </template>
            <template #footer>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-xs">
                  <template v-if="targetSettings.categories.type === 'automatic'">
                    <i class="pi pi-arrow-up"></i>
                    {{ i18n.t('settings.nzbFileTargets.categories.reorder') }}
                  </template>
                </span>
                <span>
                  <Button
                    v-if="!hasTargetCategories"
                    :label="i18n.t('settings.nzbFileTargets.categories.addNewCategory')"
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
        <div
          v-if="targetSettings.categories.type === 'automatic'"
          class="flex flex-justify items-center gap-4 mt-4 mb-4 flex-auto"
        >
          <label for="name" class="font-semibold w-36">{{
            i18n.t('settings.nzbFileTargets.categories.fallbackCategorySelection')
          }}</label>
          <FormField
            :name="i18n.t('settings.nzbFileTargets.categories.fallbackCategorySelection')"
            :initial-value="targetSettings.categories.fallback"
            class="grid-row flex-auto"
          >
            <div class="flex items-center gap-8">
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="targetSettings.categories.fallback"
                  input-id="none"
                  name="categorySelectionFallback"
                  value="none"
                />
                <label for="automatic">{{ i18n.t('settings.nzbFileTargets.categories.categorySelection.none') }}</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="targetSettings.categories.fallback"
                  input-id="manual"
                  name="categorySelectionFallback"
                  value="manual"
                />
                <label for="manual">{{ i18n.t('settings.nzbFileTargets.categories.categorySelection.manual') }}</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="targetSettings.categories.fallback"
                  input-id="fixed"
                  name="categorySelectionFallback"
                  value="fixed"
                />
                <label for="fixed">{{ i18n.t('settings.nzbFileTargets.categories.categorySelection.fixed') }}</label>
              </div>
            </div>
          </FormField>
        </div>
      </template>
    </template>
    <EditCategoryDialog
      v-if="editCategoryDialog"
      :categories-settings="targetSettings.categories"
      :index="editCategoryDialogIndex"
      @save="
        (categorySettings) => {
          targetSettings.categories.categories[editCategoryDialogIndex] = toRaw(categorySettings)
          editCategoryDialog = false
          checkDefault(targetSettings.categories.categories)
        }
      "
      @close="editCategoryDialog = false"
    >
    </EditCategoryDialog>
  </div>
</template>

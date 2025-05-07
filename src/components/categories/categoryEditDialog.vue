<script setup lang="ts">
import { Form, FormField } from '@primevue/forms'
import { Button, Dialog, InputText, Message } from 'primevue'
import { PropType, ref, toRaw } from 'vue'

import { i18n } from '#i18n'
import PredefinedRegExpDialog from '@/components/categories/categoryRegExpDialog.vue'
import { CategoriesSettings, categoryDefaultSettings, CategorySettings } from '@/services/categories'
import { regexpResolver, requiredResolver } from '@/services/resolvers'

const props = defineProps({
  categoriesSettings: {
    type: Object as PropType<CategoriesSettings>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})
const emit = defineEmits(['save', 'close'])

// default is add
const categorySettings = ref(structuredClone(categoryDefaultSettings) as CategorySettings)
let title = i18n.t('settings.nzbFileTargets.categories.category.addCategory')

if (props.categoriesSettings.categories[props.index]) {
  categorySettings.value = structuredClone(toRaw(props.categoriesSettings.categories[props.index]))
  title = i18n.t('settings.nzbFileTargets.categories.category.editCategory')
}

const showPredefinedRegExpDialog = ref(false)
</script>

<template>
  <Form v-slot="$form" :validate-on-blur="true" :validate-on-value-update="true" :validate-on-mount="true">
    <Dialog
      :visible="true"
      modal
      :header="title"
      style="width: 55rem; max-width: 55rem; min-height: fit-content; max-height: 100%"
    >
      <div class="flex items-center gap-4 mb-4">
        <label for="category" class="font-semibold min-w-32 w-32">{{
          i18n.t('settings.nzbFileTargets.categories.category.name')
        }}</label>
        <FormField
          v-slot="$field"
          :name="i18n.t('settings.nzbFileTargets.categories.category.name')"
          :initial-value="categorySettings.name"
          :resolver="requiredResolver"
          class="grid-row flex-auto"
        >
          <InputText
            id="category"
            v-model="categorySettings.name as string"
            class="w-full"
            size="small"
            autocomplete="off"
            type="text"
            :disabled="categorySettings.isTargetCategory"
          />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
            $field.error?.message
          }}</Message>
        </FormField>
      </div>
      <div v-if="categoriesSettings.type === 'automatic'" class="flex items-center gap-4 mb-4">
        <label for="regexpL" class="font-semibold min-w-32 w-32">{{
          i18n.t('settings.nzbFileTargets.categories.regexp')
        }}</label>

        <FormField
          v-slot="$field"
          :name="i18n.t('settings.nzbFileTargets.categories.regexp')"
          :initial-value="categorySettings.regexp"
          :resolver="regexpResolver"
          class="grid-row flex-auto"
        >
          <InputText
            id="regexp"
            v-model="categorySettings.regexp as string"
            class="w-full"
            size="small"
            autocomplete="off"
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
              v-if="categoriesSettings.type === 'automatic'"
              type="button"
              :label="i18n.t('settings.nzbFileTargets.categories.regexpList')"
              severity="warn"
              text
              raised
              @click="showPredefinedRegExpDialog = true"
            />
          </div>
          <div class="flex justify-end gap-4">
            <Button type="button" :label="i18n.t('common.cancel')" severity="secondary" @click="emit('close')"></Button>
            <Button
              type="button"
              :label="i18n.t('common.save')"
              :disabled="!$form.valid"
              @click="emit('save', categorySettings)"
            ></Button>
          </div>
        </div>
      </template>
    </Dialog>
  </Form>
  <PredefinedRegExpDialog
    v-if="showPredefinedRegExpDialog"
    @close="showPredefinedRegExpDialog = false"
    @save="
      (regExp) => {
        categorySettings.regexp = regExp
        showPredefinedRegExpDialog = false
      }
    "
  />
</template>

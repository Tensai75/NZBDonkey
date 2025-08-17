<script setup lang="ts">
import { FormField } from '@primevue/forms'
import { InputNumber } from 'primevue'
import { ref, watch } from 'vue'

import { i18n } from '#imports'

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const timeout = ref(props.modelValue / 1000) // Convert milliseconds to seconds
watch(
  () => props.modelValue,
  (val) => {
    timeout.value = val / 1000 // Convert milliseconds to seconds
  }
)

watch(timeout, (val) => {
  emit('update:modelValue', val * 1000) // Convert seconds back to milliseconds
})
</script>

<template>
  <FormField name="timeout" :initial-value="timeout" class="grid-row flex-auto">
    <InputNumber
      v-model="timeout"
      :min="10"
      :max="300"
      :step="10"
      :use-grouping="false"
      :suffix="'   ' + i18n.t('common.settings.timeout.seconds')"
      show-buttons
      size="small"
      style="inset-inline-end: 0"
    />
  </FormField>
</template>

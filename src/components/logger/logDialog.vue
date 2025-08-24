<script setup lang="ts">
import { Button, Dialog } from 'primevue'
import { computed } from 'vue'

import DebugLog from './debugLog.vue'
import NzbLog from './nzbLog.vue'

import { i18n } from '#i18n'

const props = defineProps({
  logType: {
    type: String,
    required: true,
    validator: (value: string) => ['debugLog', 'nzbLog'].includes(value),
  },
})
const title = computed(() => {
  if (props.logType === 'debugLog') {
    return i18n.t('menu.logger.debugLog.title')
  } else if (props.logType === 'nzbLog') {
    return i18n.t('menu.logger.nzbLog.title')
  }
  return ''
})
const emit = defineEmits(['close'])
</script>

<template>
  <Dialog :visible="true" :closable="false" modal :header="title" style="width: 800px; max-width: 800px">
    <div style="height: 60vh">
      <DebugLog v-if="props.logType === 'debugLog'" />
      <NzbLog v-else-if="props.logType === 'nzbLog'" />
    </div>
    <template #footer>
      <div class="flex justify-end w-full gap-4">
        <Button type="button" :label="i18n.t('common.close')" @click="emit('close')"></Button>
      </div>
    </template>
  </Dialog>
</template>

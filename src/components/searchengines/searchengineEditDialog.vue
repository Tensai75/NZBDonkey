<script setup lang="ts">
import { Form } from '@primevue/forms'
import { Button, Dialog } from 'primevue'
import { PropType, ref, toRaw, watch } from 'vue'

import { i18n } from '#i18n'
import PredefinedSearchEnginesDialog from '@/components/searchengines/defaultSearchEnginesDialog.vue'
import DefaultEngineSettings from '@/components/searchengines/searchenginesDefaultEngineSettings.vue'
import EasyNewsEngineSettings from '@/components/searchengines/searchenginesEasyNewsSettings.vue'
import TestSearchEngineDialog from '@/components/searchengines/searchengineTestDialog.vue'
import * as searchengines from '@/services/searchengines'

const props = defineProps({
  engines: {
    type: Object as PropType<searchengines.SearchEngine[]>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})
const emit = defineEmits(['save', 'close'])

// default is add
const title = ref(i18n.t('settings.searchEngines.addDialog'))
const engine = ref(structuredClone(searchengines.defaultEngine.defaultSettings))
const isAdd = ref(true)
const showPredefinedSearchEnginesDialog = ref(true)

if (props.engines[props.index]) {
  title.value = i18n.t('settings.searchEngines.editDialog')
  engine.value = structuredClone(toRaw(props.engines[props.index]))
  isAdd.value = false
  showPredefinedSearchEnginesDialog.value = false
}

const rerenderKey = ref(0)
const showTestSearchEngineDialog = ref(false)
const searchEngineTestSuccessfull = ref(false)

watch(
  engine,
  () => {
    searchEngineTestSuccessfull.value = false
  },
  { deep: true }
)

function reset() {
  engine.value = structuredClone(searchengines.defaultEngine.defaultSettings)
  rerenderKey.value++
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
      style="width: 55rem; max-width: 55rem; min-height: fit-content; max-height: 100%"
    >
      <DefaultEngineSettings
        v-if="engine.type === 'defaultEngine'"
        v-model:settings="engine"
        @rerender="rerenderKey++"
      />
      <EasyNewsEngineSettings v-if="engine.type === 'easyNewsEngine'" v-model:settings="engine" />
      <template #footer>
        <div class="flex justify-between gap-4 w-full">
          <div>
            <Button
              v-if="isAdd"
              type="button"
              :label="i18n.t('settings.searchEngines.searchEnginesList')"
              severity="warn"
              text
              raised
              @click="showPredefinedSearchEnginesDialog = true"
            />
          </div>
          <div class="flex justify-end gap-4">
            <Button
              v-if="isAdd"
              type="button"
              :label="i18n.t('common.reset')"
              severity="secondary"
              @click="reset()"
            ></Button>
            <Button type="button" :label="i18n.t('common.cancel')" severity="secondary" @click="emit('close')"></Button>
            <Button
              v-if="!searchEngineTestSuccessfull && (isAdd || !engine.isDefault)"
              type="button"
              :label="i18n.t('common.testSearchEngine')"
              :disabled="!$form.valid"
              @click="showTestSearchEngineDialog = true"
            ></Button>
            <Button
              v-if="searchEngineTestSuccessfull && (isAdd || !engine.isDefault)"
              type="button"
              :label="i18n.t('common.save')"
              :disabled="!$form.valid"
              @click="emit('save', engine)"
            ></Button>
          </div>
        </div>
      </template>
    </Dialog>
  </Form>
  <TestSearchEngineDialog
    v-model:show-test-search-engine-dialog="showTestSearchEngineDialog"
    v-model:engine-settings="engine"
    @success="searchEngineTestSuccessfull = true"
    @close="showTestSearchEngineDialog = false"
  />
  <PredefinedSearchEnginesDialog
    v-if="showPredefinedSearchEnginesDialog"
    @close="showPredefinedSearchEnginesDialog = false"
    @save="
      (searchEngine) => {
        engine = searchEngine
        showPredefinedSearchEnginesDialog = false
        rerenderKey++
      }
    "
  />
</template>

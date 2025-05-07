<script setup lang="ts">
import { Button, Dialog, ProgressSpinner } from 'primevue'
import { ref } from 'vue'

import { i18n } from '#i18n'
import { CategorySettings as CategoriesRegExpListItem } from '@/services/categories'
import { getCategoriesRegexpList } from '@/services/lists'

const emit = defineEmits(['save', 'close'])

const regExpList = ref<CategoriesRegExpListItem[]>()
const regExpListLoaded = ref(false)

getList()

async function getList() {
  regExpList.value = await getCategoriesRegexpList()
  regExpListLoaded.value = true
}
</script>
<template>
  <Dialog :visible="true" :closable="false" :show-header="false" modal :style="{ width: '35rem' }">
    <div class="flex flex-col px-0 py-0 gap-4 mt-4 rounded">
      <div v-if="!regExpListLoaded" class="flex items-center justify-center gap-4 mt-4 mb-4" style="min-height: 100px">
        <ProgressSpinner style="width: 60px; height: 60px" stroke-width="3" />
      </div>
      <div v-if="regExpListLoaded" class="flex flex-col items-center justify-center gap-4 mt-4">
        <div v-for="item in regExpList" :key="item.name" class="flex items-center gap-4 flex-auto">
          <Button
            severity="contrast"
            variant="text"
            raised
            class="!border-2 w-96 mx-auto"
            :title="item.name"
            @click="emit('save', item.regexp)"
          >
            <div>{{ item.name }}</div>
          </Button>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button type="button" :label="i18n.t('common.cancel')" severity="secondary" @click="emit('close')"></Button>
      </div>
    </template>
  </Dialog>
</template>

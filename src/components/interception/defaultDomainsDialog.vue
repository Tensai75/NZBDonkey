<script setup lang="ts">
import { Button, Dialog, ProgressSpinner } from 'primevue'
import { ref } from 'vue'

import { i18n } from '#i18n'
import { DomainSettings as InterceptionDomainsListItem } from '@/services/interception'
import { getInterceptionDomainsList } from '@/services/lists'

const emit = defineEmits(['save', 'close'])

const domainsList = ref<InterceptionDomainsListItem[]>()
const domainsListLoaded = ref(false)

getList()

async function getList() {
  domainsList.value = await getInterceptionDomainsList()
  domainsListLoaded.value = true
}
</script>
<template>
  <Dialog :visible="true" :closable="false" :show-header="false" modal :style="{ width: '35rem' }">
    <div class="flex flex-col px-0 py-0 gap-4 mt-4 rounded">
      <div v-if="!domainsListLoaded" class="flex items-center justify-center gap-4 mt-4 mb-4" style="min-height: 100px">
        <ProgressSpinner style="width: 60px; height: 60px" stroke-width="3" />
      </div>
      <div v-if="domainsListLoaded" class="flex flex-col items-center justify-center gap-4 mt-4">
        <div v-if="domainsList!.length === 0" class="text-center text-smpx-4">
          {{ i18n.t('settings.interception.defaultDomainsDialog.noDomains') }}
        </div>
        <div v-for="item in domainsList" v-else :key="item.domain" class="flex items-center gap-4 flex-auto">
          <Button
            severity="contrast"
            variant="text"
            raised
            class="!border-2 w-96 mx-auto"
            :title="item.domain"
            @click="emit('save', item)"
          >
            <img
              :src="item.icon ? item.icon : 'https://www.faviconextractor.com/favicon/' + item.domain + '?larger=true'"
              style="width: 24px; height: 24px"
            />
            <div>{{ item.domain }}</div>
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

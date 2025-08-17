<script setup lang="ts">
import { Form, FormField } from '@primevue/forms'
import { Button, Dialog, InputText, Listbox, Message, RadioButton, ToggleSwitch } from 'primevue'
import { PropType, ref, toRaw } from 'vue'

import { i18n } from '#i18n'
import DefaultDomainsDialog from '@/components/interception/defaultDomainsDialog.vue'
import * as interception from '@/services/interception'
import { requiredBaseDomainResolver, requiredNetRequestRegexpResolver } from '@/services/resolvers'

const props = defineProps({
  domains: {
    type: Object as PropType<interception.DomainSettings[]>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})
const emit = defineEmits(['save', 'close'])
const showAdvancedSettings = ref(false)

// default is add
const title = ref(i18n.t('settings.interception.addDialog'))
const domain = ref<interception.DomainSettings>(structuredClone(interception.defaultDomainSettings))
const isAdd = ref(true)
const showDefaultsDomainsDialog = ref(true)

if (props.domains[props.index]) {
  title.value = i18n.t('settings.interception.editDialog')
  domain.value = structuredClone(toRaw(props.domains[props.index]))
  isAdd.value = false
  showDefaultsDomainsDialog.value = false
}

const extensions = ref(['zip', 'rar', '7z'])
const rerenderKey = ref(0)

function reset() {
  domain.value = structuredClone(interception.defaultDomainSettings)
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
    <Dialog :visible="true" :closable="false" modal :header="title" style="width: 55rem; max-width: 55rem">
      <div class="flex items-center gap-4 mb-4 flex-auto">
        <label for="name" class="font-semibold min-w-32 max-w-32 w-32">{{
          i18n.t('settings.interception.domains.domain.title')
        }}</label>
        <FormField
          v-slot="$field"
          :name="i18n.t('settings.interception.domains.domain.title')"
          :initial-value="domain.domain"
          :resolver="requiredBaseDomainResolver"
          :validate-on-blur="true"
          :validate-on-value-update="true"
          :validate-on-mount="true"
          class="grid-row flex-auto"
        >
          <InputText
            id="name"
            v-model="domain.domain as string"
            class="w-full"
            size="small"
            autocomplete="off"
            type="text"
            :disabled="domain.isDefault"
          />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
            $field.error?.message
          }}</Message>
        </FormField>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="name" class="font-semibold min-w-32 max-w-32 w-32">{{
          i18n.t('settings.interception.domains.domain.pathRegExp')
        }}</label>
        <FormField
          v-slot="$field"
          :name="i18n.t('settings.interception.domains.domain.pathRegExp')"
          :initial-value="domain.pathRegExp"
          :resolver="requiredNetRequestRegexpResolver"
          :validate-on-blur="true"
          :validate-on-value-update="true"
          :validate-on-mount="true"
          class="grid-row flex-auto"
        >
          <InputText
            id="name"
            v-model="domain.pathRegExp as string"
            class="w-full"
            size="small"
            autocomplete="off"
            type="text"
            :disabled="domain.isDefault"
          />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
            $field.error?.message
          }}</Message>
        </FormField>
      </div>
      <div class="flex items-center gap-4 pt-4 mb-4">
        <label for="name" class="font-semibold min-w-32 max-w-32 w-32">{{
          i18n.t('settings.interception.domains.domain.showNzbDialog.title')
        }}</label>
        <FormField
          :name="i18n.t('settings.interception.domains.domain.showNzbDialog.title')"
          :initial-value="domain.showNzbDialog"
          class="grid-row flex-auto"
        >
          <div class="flex items-center">
            <ToggleSwitch v-model="domain.showNzbDialog" />
            <label class="label-text pl-4">
              {{ i18n.t('settings.interception.domains.domain.showNzbDialog.description') }}
            </label>
          </div>
        </FormField>
      </div>
      <div class="flex items-center gap-4 pt-4 mb-4">
        <label for="name" class="font-semibold min-w-32 max-w-32 w-32">{{
          i18n.t('settings.interception.domains.domain.interceptArchiveFiles.title')
        }}</label>
        <FormField
          v-slot="$field"
          name="extensions"
          :initial-value="domain.archiveFileExtensions"
          class="grid-row flex-auto"
        >
          <Listbox
            v-model="domain.archiveFileExtensions"
            :options="extensions"
            multiple
            checkmark
            option-label="value"
            size="small"
            :disabled="domain.isDefault"
          >
            <template #option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option }}</div>
              </div>
            </template>
          </Listbox>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple" class="flex-auto">{{
            $field.error?.message
          }}</Message>
        </FormField>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="name" class="font-semibold min-w-32 max-w-32 w-32">{{
          i18n.t('settings.common.confirmAdvancedSettings.header')
        }}</label>
        <ToggleSwitch v-model="showAdvancedSettings" :disabled="domain.isDefault" />
      </div>
      <div v-show="showAdvancedSettings" class="flex items-center gap-4 mb-4">
        <label for="name" class="font-semibold min-w-32 max-w-32 w-32">{{
          i18n.t('settings.interception.domains.domain.postDataHandling.title')
        }}</label>
        <FormField
          :name="i18n.t('settings.interception.domains.domain.postDataHandling.title')"
          :initial-value="domain.postDataHandling"
          class="grid-row flex-auto"
        >
          <div class="mt-4">
            <div class="flex items-center gap-2 mb-4">
              <RadioButton
                v-model="domain.postDataHandling"
                input-id="sendAsURLSearchParams"
                name="postDataHandling"
                value="sendAsURLSearchParams"
                :disabled="domain.isDefault"
              />
              <label for="sendAsURLSearchParams"
                >{{ i18n.t('settings.interception.domains.domain.postDataHandling.sendAsURLSearchParams') }} ({{
                  i18n.t('common.default')
                }})</label
              >
            </div>
            <div class="flex items-center gap-2">
              <RadioButton
                v-model="domain.postDataHandling"
                input-id="sendAsFormData"
                name="postDataHandling"
                value="sendAsFormData"
                :disabled="domain.isDefault"
              />
              <label for="sendAsFormData">{{
                i18n.t('settings.interception.domains.domain.postDataHandling.sendAsFormData')
              }}</label>
            </div>
          </div>
        </FormField>
      </div>
      <div v-show="showAdvancedSettings" class="flex items-center gap-4 pt-4 mb-4">
        <label for="name" class="font-semibold min-w-32 max-w-32 w-32">Fetch Origin</label>
        <FormField name="Fetch Origin" :initial-value="domain.fetchOrigin" class="grid-row flex-auto">
          <div class="flex items-center">
            <div class="flex items-center gap-2">
              <RadioButton
                v-model="domain.fetchOrigin"
                input-id="background"
                name="fetchOrigin"
                value="background"
                :disabled="domain.isDefault"
              />
              <label for="sendAsURLSearchParams">Background Script ({{ i18n.t('common.default') }})</label>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <RadioButton
                v-model="domain.fetchOrigin"
                input-id="injection"
                name="fetchOrigin"
                value="injection"
                :disabled="domain.isDefault"
              />
              <label for="sendAsFormData">Content Script</label>
            </div>
          </div>
        </FormField>
      </div>
      <template #footer>
        <div class="flex justify-between w-full gap-4">
          <div>
            <Button
              v-if="isAdd"
              type="button"
              :label="i18n.t('settings.interception.domains.domainsList')"
              severity="warn"
              text
              raised
              @click="showDefaultsDomainsDialog = true"
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
              type="button"
              :label="i18n.t('common.save')"
              :disabled="!$form.valid"
              @click="emit('save', domain)"
            ></Button>
          </div>
        </div>
      </template>
    </Dialog>
  </Form>
  <DefaultDomainsDialog
    v-if="showDefaultsDomainsDialog"
    @close="showDefaultsDomainsDialog = false"
    @save="
      (defaultDomain) => {
        domain = defaultDomain
        showDefaultsDomainsDialog = false
        rerenderKey++
      }
    "
  />
</template>

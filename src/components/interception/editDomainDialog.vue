<script setup lang="ts">
import { Form, FormField } from '@primevue/forms'
import { Button, Dialog, InputText, Listbox, Message, RadioButton, ToggleSwitch } from 'primevue'
import { PropType, ref, toRaw } from 'vue'

import { i18n } from '#i18n'
import DefaultDomainsDialog from '@/components/interception/defaultDomainsDialog.vue'
import * as interception from '@/services/interception'
import { requiredBaseDomainResolver, requiredRegexpResolver } from '@/services/resolvers'

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
    <Dialog :visible="true" :closable="false" modal :header="title" style="width: 48rem; max-width: 48rem">
      <div class="flex items-center gap-4 mb-4 flex-auto">
        <label for="name" class="font-semibold w-24">{{ i18n.t('settings.interception.domains.domain.title') }}</label>
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
        <label for="name" class="font-semibold w-24">{{
          i18n.t('settings.interception.domains.domain.pathRegExp')
        }}</label>
        <FormField
          v-slot="$field"
          :name="i18n.t('settings.interception.domains.domain.pathRegExp')"
          :initial-value="domain.pathRegExp"
          :resolver="requiredRegexpResolver"
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
        <label for="name" class="font-semibold w-24">{{
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
        <label for="name" class="font-semibold w-24">{{
          i18n.t('settings.interception.domains.domain.requiresPostDataHandling.title')
        }}</label>
        <FormField
          :name="i18n.t('settings.interception.domains.domain.requiresPostDataHandling.title')"
          :initial-value="domain.requiresPostDataHandling"
          class="grid-row flex-auto"
        >
          <div class="flex items-center">
            <ToggleSwitch v-model="domain.requiresPostDataHandling" :disabled="domain.isDefault" />
            <label class="label-text pl-4">
              {{ i18n.t('settings.interception.domains.domain.requiresPostDataHandling.description') }}
            </label>
          </div>
          <div v-show="domain.requiresPostDataHandling" class="mt-4">
            <div class="flex items-center gap-2 mb-4">
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
            <div class="flex items-center gap-2">
              <RadioButton
                v-model="domain.postDataHandling"
                input-id="sendAsURLSearchParams"
                name="postDataHandling"
                value="sendAsURLSearchParams"
                :disabled="domain.isDefault"
              />
              <label for="sendAsURLSearchParams">{{
                i18n.t('settings.interception.domains.domain.postDataHandling.sendAsURLSearchParams')
              }}</label>
            </div>
          </div>
        </FormField>
      </div>
      <div class="flex items-center gap-4 pt-4 mb-4">
        <label for="name" class="font-semibold w-24">Fetch Origin</label>
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
              <label for="sendAsURLSearchParams">Background Script</label>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <RadioButton
                v-model="domain.fetchOrigin"
                input-id="injection"
                name="fetchOrigin"
                value="injection"
                :disabled="domain.isDefault"
              />
              <label for="sendAsFormData">Injection Script</label>
            </div>
          </div>
        </FormField>
      </div>
      <div class="flex items-center gap-4 pt-4 mb-4">
        <label for="name" class="font-semibold w-24">{{
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

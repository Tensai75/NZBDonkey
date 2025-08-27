import 'floating-vue/dist/style.css'

import { vTooltip } from 'floating-vue'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import { createApp } from 'vue'

import App from './App.vue'

import { i18n } from '#i18n'
import { MyPreset } from '@/assets/presets'
import log from '@/services/logger/debugLogger'

log.initDebugLog('options')

const primeVueTheme = {
  theme: {
    preset: MyPreset,
  },
  locale: {
    apply: i18n.t('common.apply'),
    clear: i18n.t('common.clear'),
    emptyMessage: i18n.t('common.noAvailableOptions'),
  },
}

const app = createApp(App).use(PrimeVue, primeVueTheme).use(ConfirmationService).directive('tooltip', vTooltip)

app.mount('#app')

export default app

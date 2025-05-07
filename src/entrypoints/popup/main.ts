import 'floating-vue/dist/style.css'

import { vTooltip } from 'floating-vue'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import { createApp } from 'vue'

import App from './App.vue'

import { MyPreset } from '@/assets/presets'
import log from '@/services/logger/debugLogger'

log.initDebugLog('popup')

const primeVueTheme = {
  theme: {
    preset: MyPreset,
  },
}

const app = createApp(App).use(PrimeVue, primeVueTheme).use(ConfirmationService).directive('tooltip', vTooltip)

app.mount('#app')

export default app

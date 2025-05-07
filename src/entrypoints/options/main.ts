import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import { createApp } from 'vue'

import App from './App.vue'

import { MyPreset } from '@/assets/presets'
import log from '@/services/logger/debugLogger'

log.initDebugLog('options')

const primeVueTheme = {
  theme: {
    preset: MyPreset,
  },
}

const app = createApp(App).use(PrimeVue, primeVueTheme).use(ConfirmationService)

app.mount('#app')

export default app

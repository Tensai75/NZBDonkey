import PrimeVue from 'primevue/config'
import { createApp } from 'vue'

import App from './App.vue'

import { MyPreset } from '@/assets/presets'
import log from '@/services/logger/debugLogger'

log.initDebugLog('nzbdonkeypage')

const primeVueTheme = {
  theme: {
    preset: MyPreset,
  },
}

const app = createApp(App).use(PrimeVue, primeVueTheme)

app.mount('#app')

export default app

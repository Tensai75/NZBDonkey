import PrimeVue from 'primevue/config'
import { createApp } from 'vue'

import App from './App.vue'

import { createShadowRootUi, defineContentScript } from '#imports'
import { MyPreset } from '@/assets/presets'
import log from '@/services/logger/debugLogger'

export default defineContentScript({
  registration: 'runtime',
  matches: ['<all_urls>'],
  main(ctx) {
    log.initDebugLog('selection-content')
    const primeVueTheme = {
      theme: {
        preset: MyPreset,
        options: {
          prefix: 'nzbdonkey',
        },
      },
    }
    // Define the UI
    createShadowRootUi(ctx, {
      name: 'nzbdonkey-selection-dialog',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      inheritStyles: true,
      onMount: (container) => {
        // Define how the UI will be mounted inside the container
        const app = createApp(App).use(PrimeVue, primeVueTheme)
        app.mount(container)
        return app
      },
      onRemove: (app) => {
        // Unmount the app when the UI is removed
        app?.unmount()
      },
    }).then((ui) => {
      // Mount the UI
      ui.mount()
    })
  },
})

import 'wxt'

import { resolve } from 'node:path'

import { defineWxtModule } from 'wxt/modules'

export default defineWxtModule({
  name: 'libarchive-wasm',
  setup(wxt) {
    wxt.logger.log(`Copying ${resolve('src/services/interception/libarchive-wasm/libarchive.wasm')}`)
    wxt.hook('build:publicAssets', (_, assets) => {
      assets.push({
        absoluteSrc: resolve('src/services/interception/libarchive-wasm/libarchive.wasm'),
        relativeDest: 'libarchive.wasm',
      })
    })
  },
})

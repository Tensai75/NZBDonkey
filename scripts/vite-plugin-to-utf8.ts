import { OutputBundle, OutputOptions } from 'rollup'
import { PluginOption } from 'vite'

function strToUtf8(str: string) {
  return str
    .split('')
    .map((ch) => (ch.charCodeAt(0) <= 0x7f ? ch : '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4)))
    .join('')
}

export default function toUtf8(): PluginOption {
  return {
    name: 'to-utf8',
    generateBundle(options: OutputOptions, bundle: OutputBundle) {
      // Iterate through each asset in the bundle
      for (const fileName in bundle) {
        if (bundle[fileName].type === 'chunk') {
          // Assuming you want to convert the chunk's code
          const originalCode = bundle[fileName].code
          const modifiedCode = strToUtf8(originalCode)

          // Update the chunk's code with the modified version
          bundle[fileName].code = modifiedCode
        }
      }
    },
  }
}

import { vitePluginMdToHTML } from 'vite-plugin-md-to-html'
import { defineConfig, type ConfigEnv } from 'wxt'

import toUtf8 from './scripts/vite-plugin-to-utf8'

import type { Browser } from '#imports'

const getManifest: (env: ConfigEnv) => Partial<Browser.runtime.Manifest> = (env) => {
  const manifest: Partial<Browser.runtime.Manifest> = {
    name: '__MSG_extension_name__',
    description: '__MSG_extension_description__',
    default_locale: 'en',
    permissions: [
      'storage',
      'scripting',
      'notifications',
      'downloads',
      'contextMenus',
      'clipboardWrite',
      'webRequest',
      'declarativeNetRequestWithHostAccess',
    ],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['/injection.js', '/libarchive.wasm', '/icon/*', '/img/*', '/assets/style.css'],
        matches: ['<all_urls>'],
      },
    ],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
  }
  if (env.browser === 'firefox') {
    manifest.browser_specific_settings = {
      gecko: {
        id: '{dd77cf0b-b93f-4e9f-8006-b642c02219db}',
      },
    }
  }
  return manifest
}

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',
  publicDir: 'src/public',
  modulesDir: 'src/modules',
  modules: ['@wxt-dev/module-vue', '@wxt-dev/i18n/module'],
  imports: false,
  manifest: getManifest,
  vite: () => ({
    plugins: [vitePluginMdToHTML(), toUtf8()],
  }),
  zip: {
    excludeSources: ['icons/**', 'screenshots/**', '*.yml'],
    artifactTemplate: '{{name}}-v{{packageVersion}}-{{browser}}.zip',
    sourcesTemplate: '{{name}}-v{{packageVersion}}-sources.zip',
  },
})

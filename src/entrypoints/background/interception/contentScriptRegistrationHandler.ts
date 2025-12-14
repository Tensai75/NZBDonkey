import { browser } from '#imports'
import { getActiveDomains, watchSettings as watchInterceptionSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'

const scriptId: string = 'interception-content-script'
const scriptSource: string = '/content-scripts/interception.js'

export default function (): void {
  // async setup
  log.info('Setting up interception content script registration')
  setupInterceptionContentScriptRegistration()
  // synchronous listener for settings changes
  watchInterceptionSettings(() => {
    log.info('Interception settings have changed, updating interception content script registration')
    setupInterceptionContentScriptRegistration()
  })
}

async function setupInterceptionContentScriptRegistration(): Promise<void> {
  const domains = await getActiveDomainsMatchPatternArray()
  const scripts = await browser.scripting.getRegisteredContentScripts()
  const isRegistered = scripts.some((script) => script.id === scriptId)
  if (domains.length === 0) {
    handleNoDomains(isRegistered)
  } else {
    handleDomainsRegistration(isRegistered, domains)
  }
}

function handleNoDomains(isRegistered: boolean): void {
  if (isRegistered) {
    log.info('No active domains found, unregistering the interception content script')
    unregisterContentScript()
  } else {
    log.info('No active domains found, interception content script is not registered')
  }
}

function handleDomainsRegistration(isRegistered: boolean, domains: Array<string>): void {
  if (isRegistered) {
    log.info('Updating the registration of the interception content script')
    updateContentScript(domains)
  } else {
    log.info('Registering the interception content script')
    registerContentScript(domains)
  }
}

function unregisterContentScript(): void {
  browser.scripting
    .unregisterContentScripts({ ids: [scriptId] })
    .then(() => log.info('Unregistration of the interception content script completed successfully'))
    .catch((e: Error) => log.error('Error while unregistering the interception content script', e))
}

function updateContentScript(domains: Array<string>): void {
  browser.scripting
    .updateContentScripts([{ id: scriptId, js: [scriptSource], matches: domains }])
    .then(() => log.info('Registration of the interception content script updated successfully'))
    .catch((e: Error) => log.error('Error while updating the registration of the interception content script', e))
}

function registerContentScript(domains: Array<string>): void {
  browser.scripting
    .registerContentScripts([{ id: scriptId, js: [scriptSource], matches: domains }])
    .then(() => log.info('Registration of the interception content script completed successfully'))
    .catch((e: Error) => log.error('Error while registering the interception content script', e))
}

async function getActiveDomainsMatchPatternArray(): Promise<Array<string>> {
  const activeDomains = await getActiveDomains()
  return activeDomains.map((domain) => `*://*.${domain.domain}/*`)
}

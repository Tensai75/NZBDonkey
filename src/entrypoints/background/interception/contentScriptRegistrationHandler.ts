import { browser } from '#imports'
import {
  getSettings as getInterceptionSettings,
  Settings as InterceptionSettings,
  watchSettings as watchInterceptionSettings,
} from '@/services/interception'
import log from '@/services/logger/debugLogger'

const scriptId: string = 'interception-content-script'
const scriptSource: string = '/content-scripts/interception.js'

export default function (): void {
  getInterceptionSettings().then((settings) => {
    registerContentScript(settings)
  })
  watchInterceptionSettings((settings) => {
    log.info('interception settings have changed')
    registerContentScript(settings)
  })
}

function registerContentScript(settings: InterceptionSettings): void {
  const domains = getActiveDomainsMatchPatternArray(settings)
  browser.scripting.getRegisteredContentScripts().then((scripts) => {
    const isRegistered = scripts.some((script) => script.id === scriptId)
    if (domains.length === 0) {
      handleNoDomains(isRegistered)
    } else {
      handleDomainsRegistration(isRegistered, domains)
    }
  })
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
    registerNewContentScript(domains)
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

function registerNewContentScript(domains: Array<string>): void {
  browser.scripting
    .registerContentScripts([{ id: scriptId, js: [scriptSource], matches: domains }])
    .then(() => log.info('Registration of the interception content script completed successfully'))
    .catch((e: Error) => log.error('Error while registering the interception content script', e))
}

function getActiveDomainsMatchPatternArray(settings: InterceptionSettings): Array<string> {
  return settings.enabled
    ? settings.domains.filter((domain) => domain.isActive).map((domain) => `*://*.${domain.domain}/*`)
    : []
}

import { getActiveDomainsMatchPatternArray } from '@/services/interception'
import { InterceptionMethod } from '@/services/interception/settings'
import log from '@/services/logger/debugLogger'
import { onMessage, ProtocolMap } from '@/services/messengers/extensionMessenger'

export async function contentScriptRegistration(
  scriptId: string,
  scriptSource: string,
  scriptName: string,
  interceptionMethod?: InterceptionMethod
): Promise<void> {
  const domains = await getActiveDomainsMatchPatternArray(interceptionMethod)
  const scripts = await browser.scripting.getRegisteredContentScripts()
  const isRegistered = scripts.some((script) => script.id === scriptId)
  if (domains.length === 0) {
    handleNoDomains(isRegistered, scriptId, scriptName)
  } else {
    handleDomainsRegistration(isRegistered, domains, scriptId, scriptSource, scriptName)
  }
}

export function handleNoDomains(isRegistered: boolean, scriptId: string, scriptName: string): void {
  if (isRegistered) {
    log.info(`No active domains found, unregistering the ${scriptName} content script`)
    unregisterContentScript(scriptId, scriptName)
  } else {
    log.info(`No active domains found, ${scriptName} content script is not registered`)
  }
}

export function handleDomainsRegistration(
  isRegistered: boolean,
  domains: Array<string>,
  scriptId: string,
  scriptSource: string,
  scriptName: string
): void {
  if (isRegistered) {
    log.info(`Updating the registration of the ${scriptName} content script`)
    updateContentScript(domains, scriptId, scriptSource, scriptName)
  } else {
    log.info(`Registering the ${scriptName} content script`)
    registerContentScript(domains, scriptId, scriptSource, scriptName)
  }
}

export function unregisterContentScript(scriptId: string, scriptName: string): void {
  browser.scripting
    .unregisterContentScripts({ ids: [scriptId] })
    .then(() => log.info(`Unregistration of the ${scriptName} content script completed successfully`))
    .catch((e: Error) => log.error(`Error while unregistering the ${scriptName} content script`, e))
}

export function updateContentScript(
  domains: Array<string>,
  scriptId: string,
  scriptSource: string,
  scriptName: string
): void {
  browser.scripting
    .updateContentScripts([{ id: scriptId, js: [scriptSource], matches: domains }])
    .then(() => log.info(`Registration of the ${scriptName} content script updated successfully`))
    .catch((e: Error) => log.error(`Error while updating the registration of the ${scriptName} content script`, e))
}

export function registerContentScript(
  domains: Array<string>,
  scriptId: string,
  scriptSource: string,
  scriptName: string
): void {
  browser.scripting
    .registerContentScripts([{ id: scriptId, js: [scriptSource], matches: domains }])
    .then(() => log.info(`Registration of the ${scriptName} content script completed successfully`))
    .catch((e: Error) => log.error(`Error while registering the ${scriptName} content script`, e))
}

export function contentScriptMessageListener(
  message: keyof ProtocolMap,
  callback: (message: unknown) => Promise<void>
): void {
  onMessage(message, callback)
}

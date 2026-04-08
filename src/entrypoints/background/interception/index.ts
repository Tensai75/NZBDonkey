import contentScriptRegistrationHandler from './contentScriptRegistrationHandler'
import declarativeNetRequestHandler from './declarativeNetRequestHandler'
import fetchListenerRequestHandler from './fetchListenerRequestHandler'
import interceptionDomainsUpdate from './interceptionDomainsUpdate'

export default function (): void {
  contentScriptRegistrationHandler()
  fetchListenerRequestHandler()
  declarativeNetRequestHandler()
  interceptionDomainsUpdate()
}

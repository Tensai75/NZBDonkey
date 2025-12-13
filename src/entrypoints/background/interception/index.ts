import contentScriptRegistrationHandler from './contentScriptRegistrationHandler'
import declarativeNetRequestHandler from './declarativeNetRequestHandler'
import interceptionDomainsUpdate from './interceptionDomainsUpdate'

export default function (): void {
  contentScriptRegistrationHandler()
  declarativeNetRequestHandler()
  interceptionDomainsUpdate()
}

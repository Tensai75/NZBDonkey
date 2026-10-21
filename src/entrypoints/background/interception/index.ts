import contentScriptInterceptedRequestHandler from './contentScriptInterceptedRequestHandler'
import contentScriptRegistrationHandler from './contentScriptRegistrationHandler'
import declarativeNetRequestHandler from './declarativeNetRequestHandler'
import interceptionDomainsUpdate from './interceptionDomainsUpdate'

export default function (): void {
  contentScriptRegistrationHandler()
  contentScriptInterceptedRequestHandler()
  declarativeNetRequestHandler()
  interceptionDomainsUpdate()
}

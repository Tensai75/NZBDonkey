import contentScriptRegistrationHandler from './contentScriptRegistrationHandler'
import interceptedRequestsHandler from './interceptedRequestsHandler'

export default function (): void {
  contentScriptRegistrationHandler()
  interceptedRequestsHandler()
}

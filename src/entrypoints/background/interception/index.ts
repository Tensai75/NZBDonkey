import contentScriptRegistrationHandler from './contentScriptRegistrationHandler'
import downloadInterceptionHanderl from './downloadInterceptionHanderl'
import interceptedRequestsHandler from './interceptedRequestsHandler'

export default function (): void {
  contentScriptRegistrationHandler()
  interceptedRequestsHandler()
  downloadInterceptionHanderl()
}

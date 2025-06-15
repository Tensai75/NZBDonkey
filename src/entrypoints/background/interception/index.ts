import contentScriptRegistrationHandler from './contentScriptRegistrationHandler'
import declarativeNetRequestHandler from './declarativeNetRequestHandler'

export default function (): void {
  contentScriptRegistrationHandler()
  declarativeNetRequestHandler()
}

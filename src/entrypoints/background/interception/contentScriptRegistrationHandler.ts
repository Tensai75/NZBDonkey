import { watchSettings as watchInterceptionSettings } from '@/services/interception'
import log from '@/services/logger/debugLogger'
import { contentScriptRegistration } from '@/utils/contentScriptUtilities'

const scriptId: string = 'interception-content-script'
const scriptSource: string = '/content-scripts/interception.js'

export default function (): void {
  // async setup
  log.info('Setting up interception content script registration')
  contentScriptRegistration(scriptId, scriptSource, 'interception')
  // synchronous listener for settings changes
  watchInterceptionSettings(() => {
    log.info('Interception settings have changed, updating interception content script registration')
    contentScriptRegistration(scriptId, scriptSource, 'interception')
  })
}

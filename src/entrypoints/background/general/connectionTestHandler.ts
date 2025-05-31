import { onMessage } from '@/services/messengers/extensionMessenger'
import * as targets from '@/services/targets'

export default function (): void {
  onMessage('connectionTest', (message) => {
    const targetSettings = message.data
    return targets[targetSettings.type].testConnection(targetSettings)
  })
}

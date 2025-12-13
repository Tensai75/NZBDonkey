import * as interception from '@/services/interception/'
import { updateInterceptionDomainsList } from '@/services/lists'

export default function (): void {
  // Delay the execution for 5 seconds to allow other startup tasks to complete
  setTimeout(() => {
    interception.getSettings().then(async (settings) => {
      if (settings.updateOnStartup) {
        settings.domains = await updateInterceptionDomainsList(settings.domains)
        interception.saveSettings(settings)
      }
    })
  }, 5000)
}

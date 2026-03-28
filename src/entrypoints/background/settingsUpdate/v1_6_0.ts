import { getSettings as getTargetSettings, saveSettings as saveTargetSettings } from '@/services/targets'
import { Settings as NzbgetTargetSettings } from '@/services/targets/nzbget/settings'
import { Settings as SabnzbdTargetSettings } from '@/services/targets/sabnzbd/settings'
import { Settings as SynologyTargetSettings } from '@/services/targets/synology/settings'

export default async function (): Promise<void> {
  await migrateTargetSettings()
}

async function migrateTargetSettings() {
  const settings = await getTargetSettings()

  // Add customHeaders array if it doesn't exist for sabnzbd, nzbget and synology targets
  settings.targets.forEach((target) => {
    if (['sabnzbd', 'nzbget', 'synology'].includes(target.type)) {
      if (
        (target.settings as SabnzbdTargetSettings | NzbgetTargetSettings | SynologyTargetSettings).customHeaders ===
        undefined
      ) {
        ;(target.settings as SabnzbdTargetSettings | NzbgetTargetSettings | SynologyTargetSettings).customHeaders = []
      }
    }
  })

  await saveTargetSettings(settings)
}

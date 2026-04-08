import {
  getSettings as getInterceptionSettings,
  saveSettings as saveInterceptionSettings,
} from '@/services/interception'

export default async function (): Promise<void> {
  await migrateInterceptionSettings()
}

async function migrateInterceptionSettings() {
  const settings = await getInterceptionSettings()
  settings.domains.forEach((domain) => {
    if (!domain.interceptionMethod) {
      domain.interceptionMethod = 'declarativeNetRequest'
    }
  })
  await saveInterceptionSettings(settings)
}

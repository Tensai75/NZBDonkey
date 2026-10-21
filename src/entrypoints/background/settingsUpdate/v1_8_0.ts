import {
  getSettings as getInterceptionSettings,
  saveSettings as saveInterceptionSettings
} from '@/services/interception'

export default async function (): Promise<void> {
  await migrateInterceptionSettings()
}

async function migrateInterceptionSettings() {
  // Update interception settings to include clickListenerFilterOptions if missing
  const settings = await getInterceptionSettings()
  settings.domains.forEach((domain) => {
    if (!domain.clickListenerFilterOptions) {
      domain.clickListenerFilterOptions = {
        classes: [],
        attributes: [],
        contentRegExp: "",
      }
    }
  })
  await saveInterceptionSettings(settings)
}

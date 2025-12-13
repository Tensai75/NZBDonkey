import {
  DomainSettings,
  getSettings as getInterceptionSettings,
  saveSettings as saveInterceptionSettings,
} from '@/services/interception'

export default async function (): Promise<void> {
  await migrateInterceptionSettings()
}

async function migrateInterceptionSettings() {
  const settings = await getInterceptionSettings()
  const preSettings = JSON.parse(JSON.stringify(settings))
  console.log('settings pre-update to v1.4.3', preSettings)

  // Fast check: if all domain names are unique, skip processing
  const domainNames = settings.domains.map((d) => d.domain)
  const uniqueDomainNames = new Set(domainNames)
  if (domainNames.length === uniqueDomainNames.size) {
    // No duplicates found
    return
  }

  // Group domains by domain name
  const domainMap = new Map<string, DomainSettings>()

  // Iterate through domains and keep the appropriate one
  for (const domain of settings.domains) {
    const existing = domainMap.get(domain.domain)

    if (!existing) {
      // No duplicate yet, add it
      domainMap.set(domain.domain, domain)
    } else {
      // Duplicate found - keep active over inactive, or the later one if same status
      if (domain.isActive && !existing.isActive) {
        // New one is active, existing is not - replace
        domainMap.set(domain.domain, domain)
      } else if (domain.isActive === existing.isActive) {
        // Same active status - keep the later one (current iteration)
        domainMap.set(domain.domain, domain)
      }
      // If existing is active and new one is not, keep existing (do nothing)
    }
  }

  // Update settings with deduplicated domains
  settings.domains = Array.from(domainMap.values())
  console.log('settings post-update to v1.4.3', settings)
  await saveInterceptionSettings(settings)
}

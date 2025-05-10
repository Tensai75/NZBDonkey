import searchEnginesList from '@@/lists/searchEnginesList.json'
import { PublicPath } from 'wxt/browser'

import { browser } from '#imports'
import * as general from '@/services/general'
import log from '@/services/logger/debugLogger'
import * as nzbfile from '@/services/nzbfile'
import * as searchengines from '@/services/searchengines'
import * as targets from '@/services/targets'

type OldSettings = {
  'category.automatic.categories': Array<{
    name: string
    pattern: string
  }>
  'category.automatic.fallback': false | 'default' | 'manual'
  'category.default.category': string
  'category.enabled': {
    enabled: boolean
    type: 'automatic' | 'manual' | 'default'
  }
  'category.manual.categories': string[]
  'category.manual.type': 'manual' | 'target'
  'download.categoryFolder': boolean
  'download.defaultPath': string
  'download.saveAs': boolean
  'general.catchLinks': boolean
  'general.debug': boolean
  'general.showNotifications': 'info' | 'success' | false
  'interception.enabled': {
    default: Array<{
      active: boolean
      domain: string
      handling: 'sendFormDataAsPOST' | 'sendFormDataAsGET' | 'sendFormDataAsString'
    }>
    enabled: boolean
  }
  'nzbget.addPaused': boolean
  'nzbget.basepath': string
  'nzbget.host': string
  'nzbget.password': string
  'nzbget.port': string
  'nzbget.scheme': 'http' | 'https'
  'nzbget.username': string
  'nzbtarget.type': 'download' | 'nzbget' | 'sabnzbd' | 'synology' | 'premiumize'
  'premiumize.password': string
  'processing.addCategory': boolean
  'processing.addPassword': boolean
  'processing.addTitle': boolean
  'processing.fileCheck': {
    enabled: boolean
    threshold: number
  }
  'processing.processTitel': {
    enabled: boolean
    type: 'spaces' | 'periods'
  }
  'processing.segmentCheck': {
    enabled: boolean
    threshold: number
  }
  'sabnzbd.addPaused': boolean
  'sabnzbd.apiKey': string
  'sabnzbd.basepath': string
  'sabnzbd.basicAuthPassword': string
  'sabnzbd.basicAuthUsername': string
  'sabnzbd.host': string
  'sabnzbd.port': string
  'sabnzbd.scheme': 'http' | 'https'
  'searchengines.custom': Array<{
    active: boolean
    downloadURL: string
    name: string
    responseType: 'json' | 'html'
    searchGroup: number | string
    searchPattern: string
    searchURL: string
  }>
  'searchengines.default': Array<{
    active: boolean
    downloadURL: string
    name: string
    responseType: 'json' | 'html'
    searchGroup: number | string
    searchPattern: string
    searchURL: string
  }>
  'synology.basepath': string
  'synology.basicAuthPassword': string
  'synology.basicAuthUsername': string
  'synology.host': string
  'synology.password': string
  'synology.port': string
  'synology.scheme': 'http' | 'https'
  'synology.username': string
}

export default async function (): Promise<void> {
  log.info('NZBDonkey has been updated from <= v0.7.7')
  log.info('migrating settings from v0.7.7')
  try {
    const storedSettings = await browser.storage.sync.get(null)
    const oldSettings = storedSettings as OldSettings
    await migrateGeneralSettings(oldSettings)
    await migrateTargetSettings(oldSettings)
    await migrateSearchEnginesSettings(oldSettings)
    await migrateNzbfileSettings(oldSettings)
    await updateVersionInStorage()
    openInfoPage()
  } catch (error) {
    await handleMigrationError(error)
  }
}

async function updateVersionInStorage(): Promise<void> {
  const version = browser.runtime.getManifest().version
  await browser.storage.sync.set({ version })
  log.info(`updated settings version to ${version}`)
}

function openInfoPage(): void {
  const infoPageUrl = browser.runtime.getURL('/nzbdonkey.html#UPDATED' as PublicPath)
  browser.tabs.create({ url: infoPageUrl })
  log.info('opened info page')
}

async function handleMigrationError(error: unknown): Promise<void> {
  log.error('error migrating settings:', error instanceof Error ? error : new Error(String(error)))
  log.info('clearing settings and opening info page')
  await browser.storage.sync.clear()
  await updateVersionInStorage()
  openInfoPage()
}

async function migrateGeneralSettings(oldSettings: OldSettings) {
  const settings: general.Settings = {
    ...general.defaultSettings,
    catchLinks: oldSettings['general.catchLinks'] ?? general.defaultSettings.catchLinks,
    debug: oldSettings['general.debug'] ?? general.defaultSettings.debug,
    notifications:
      oldSettings['general.showNotifications'] === false
        ? 2
        : (({ info: 0, success: 1 }[oldSettings['general.showNotifications']] ?? 3) as 0 | 1 | 2 | 3),
  }
  await general.saveSettings(settings)
}

async function migrateTargetSettings(oldSettings: OldSettings) {
  const settings: targets.TargetsSettings = targets.defaultSettings
  const targetType = oldSettings['nzbtarget.type'] as targets.TargetType
  if (!targetType) return
  const target: targets.TargetSettings = {
    ...targets[targetType].defaultSettings,
    settings: getTargetSettings(targetType, oldSettings),
    categories: getCategorySettings(targetType, oldSettings),
    isActive: true,
  }
  settings.targets = [target]
  await targets.saveSettings(settings)
}

function getTargetSettings(
  targetType: targets.TargetType,
  oldSettings: OldSettings
): targets.TargetSettings['settings'] {
  switch (targetType) {
    case 'download':
      return {
        defaultPath: oldSettings['download.defaultPath'] ?? '',
        saveAs: oldSettings['download.saveAs'] ?? false,
      } as targets.download.Settings
    case 'nzbget':
      return {
        scheme: oldSettings['nzbget.scheme'] ?? 'http',
        host: oldSettings['nzbget.host'] ?? 'localhost',
        port: oldSettings['nzbget.port'] ?? '6789',
        username: oldSettings['nzbget.username'] ?? '',
        password: oldSettings['nzbget.password'] ?? '',
        basepath: oldSettings['nzbget.basepath'] ?? '',
        addPaused: oldSettings['nzbget.addPaused'] ?? false,
        timeout: 30000,
        dupeMode: 'Force',
      } as targets.nzbget.Settings
    case 'sabnzbd':
      return {
        scheme: oldSettings['sabnzbd.scheme'] ?? 'http',
        host: oldSettings['sabnzbd.host'] ?? 'localhost',
        port: oldSettings['sabnzbd.port'] ?? '8080',
        basicAuthUsername: oldSettings['sabnzbd.basicAuthUsername'] ?? '',
        basicAuthPassword: oldSettings['sabnzbd.basicAuthPassword'] ?? '',
        apiKey: oldSettings['sabnzbd.apiKey'] ?? '',
        basepath: oldSettings['sabnzbd.basepath'] ?? '',
        addPaused: oldSettings['sabnzbd.addPaused'] ?? false,
        timeout: 30000,
      } as targets.sabnzbd.Settings
    case 'synology':
      return {
        scheme: oldSettings['synology.scheme'] ?? 'http',
        host: oldSettings['synology.host'] ?? 'localhost',
        port: oldSettings['synology.port'] ?? '5000',
        username: oldSettings['synology.username'] ?? '',
        password: oldSettings['synology.password'] ?? '',
        basepath: oldSettings['synology.basepath'] ?? '',
        timeout: 30000,
      } as targets.synology.Settings
    case 'premiumize':
      return {
        apiKey: oldSettings['premiumize.password'] ?? '',
        timeout: 30000,
      } as targets.premiumize.Settings
    default:
      log.error(`Unknown target type: ${targetType}`)
      return {} as targets.TargetSettings['settings']
  }
}

function getCategorySettings(
  targetType: targets.TargetType,
  oldSettings: OldSettings
): targets.TargetSettings['categories'] {
  if (
    !oldSettings['category.enabled']?.enabled ||
    (targetType === 'download' && !oldSettings['download.categoryFolder'])
  ) {
    return { useCategories: false, type: 'manual', fallback: 'none', categories: [] }
  }
  const categories: targets.TargetSettings['categories'] = {
    useCategories: true,
    type: 'manual',
    fallback: 'none',
    categories: [],
  }
  switch (oldSettings['category.enabled'].type) {
    case 'default':
      categories.type = 'fixed'
      categories.fallback = 'none'
      categories.categories = [
        {
          active: true,
          isDefault: true,
          name: oldSettings['category.default.category'],
          regexp: '',
          isTargetCategory: false,
        },
      ]
      break
    case 'manual':
      categories.type = 'manual'
      categories.categories = oldSettings['category.manual.categories'].map((cat) => ({
        active: true,
        isDefault: false,
        name: cat,
        regexp: '',
        isTargetCategory: false,
      }))
      break
    case 'automatic':
      categories.type = 'automatic'
      categories.fallback =
        oldSettings['category.automatic.fallback'] === false
          ? 'none'
          : oldSettings['category.automatic.fallback'] === 'default'
            ? 'fixed'
            : 'manual'
      categories.categories = oldSettings['category.automatic.categories'].map((cat) => ({
        active: true,
        isDefault: false,
        name: cat.name,
        regexp: cat.pattern,
        isTargetCategory: false,
      }))
      break
    default:
      log.error(`Unknown category type: ${oldSettings['category.enabled'].type}`)
  }
  return categories
}

async function migrateSearchEnginesSettings(oldSettings: OldSettings) {
  const settings = { ...searchengines.defaultSettings }
  const oldSearchEngineMap = new Map(
    oldSettings['searchengines.default'].map((engine) => [engine.name.toLowerCase(), engine.active])
  )
  const defaultSearchEngines: searchengines.SearchEngine[] = searchEnginesList.data
    .filter((engine) => oldSearchEngineMap.has(engine.name.toLowerCase()))
    .map((engine) => ({
      ...engine,
      type: 'defaultEngine',
      isActive: oldSearchEngineMap.get(engine.name.toLowerCase()) ?? false,
      settings: engine.settings as searchengines.DefaultSearchEngineSettings,
    }))
  const customSearchEngines = oldSettings['searchengines.custom'].map((engine) => createCustomSearchEngine(engine))
  settings.engines = [...defaultSearchEngines, ...customSearchEngines]
  await searchengines.saveSettings(settings)
}

function createCustomSearchEngine(engine: OldSettings['searchengines.custom'][number]): searchengines.SearchEngine {
  return {
    type: 'defaultEngine',
    name: engine.name,
    isActive: engine.active,
    isDefault: false,
    settings: {
      searchURL: engine.searchURL,
      searchPattern: engine.searchPattern,
      responseType: engine.responseType,
      downloadURL: engine.downloadURL,
      searchGroup: engine.searchGroup,
    } as searchengines.DefaultSearchEngineSettings,
    icon: '',
  }
}

async function migrateNzbfileSettings(oldSettings: OldSettings) {
  const settings: nzbfile.Settings = {
    ...nzbfile.defaultSettings,
    addPassword: oldSettings['processing.addPassword'] ?? false,
    addTitle: oldSettings['processing.addTitle'] ?? false,
    addPasswordToFilename: oldSettings['processing.addPassword'] ?? false,
    processTitle: oldSettings['processing.processTitel']?.enabled ?? false,
    processTitleType: oldSettings['processing.processTitel']?.type === 'periods' ? 'dots' : 'spaces',
    fileCheck: oldSettings['processing.fileCheck']?.enabled ?? false,
    fileCheckThreshold: oldSettings['processing.fileCheck']?.threshold ?? 1,
    segmentCheck: oldSettings['processing.segmentCheck']?.enabled ?? false,
    segmentCheckThreshold: oldSettings['processing.segmentCheck']?.threshold
      ? oldSettings['processing.segmentCheck']?.threshold * 100
      : 2,
  }
  await nzbfile.saveSettings(settings)
}

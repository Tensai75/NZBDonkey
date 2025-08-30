import { TargetSettings } from '../settings'

import { AddLinksParams, Device as DeviceType, MyJDownloader } from './myJDownloader'
import { Settings } from './settings'

import { i18n } from '#imports'
import log from '@/services/logger/debugLogger'
import { NZBFileObject } from '@/services/nzbfile'
import { Semaphore } from '@/utils/generalUtilities'
import { b64EncodeUnicode } from '@/utils/stringUtilities'

const MAX_CONCURRENT = 5

const dlSemaphore = new Semaphore(MAX_CONCURRENT)

const APP_KEY = 'nzbdonkey_webextension'

export type Device = DeviceType

export const push = async (nzb: NZBFileObject, targetSettings: TargetSettings): Promise<void> => {
  const release = await dlSemaphore.acquire()
  try {
    const settings = targetSettings.settings as Settings
    log.info(`pushing file "${nzb.title}" to ${targetSettings.name}`)
    try {
      const params: AddLinksParams = {
        packageName: nzb.getFilename(),
        extractPassword: nzb.password !== '' ? nzb.password : '',
        dataURLs: [`data:application/nzb;base64,${b64EncodeUnicode(nzb.getAsTextFile())}`],
        autostart: !settings.addPaused,
        priority: 'DEFAULT',
      }
      const myJDownloader = new MyJDownloader(settings.username, settings.password, APP_KEY, settings.timeout)
      await myJDownloader.connect()
      await myJDownloader.addLinksRaw(settings.device, params)
      await myJDownloader.disconnect()
    } catch (e) {
      const error = e instanceof Error ? e : new Error(i18n.t('errors.unknownError'))
      log.error(`error while pushing file "${nzb.title}" to ${targetSettings.name}`, error)
      throw error
    }
  } finally {
    release()
  }
}

export const testConnection = async (targetSettings: TargetSettings): Promise<boolean> => {
  const settings = targetSettings.settings as Settings
  log.info(`testing connection to ${targetSettings.name}`)
  try {
    const myJDownloader = new MyJDownloader(settings.username, settings.password, APP_KEY, settings.timeout)
    await myJDownloader.connect()
    await myJDownloader.disconnect()
    return true
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`error while testing connection to ${targetSettings.name}: ${error.message}`)
    throw error
  }
}

export const getCategories = async (targetSettings: TargetSettings): Promise<string[]> => {
  log.info(`getting the categories from ${targetSettings.name}`)
  try {
    throw new Error('not implemented')
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`error while getting the categories from ${targetSettings.name}`, error)
    throw e
  }
}

export const getDevices = async (targetSettings: TargetSettings): Promise<Device[]> => {
  const settings = targetSettings.settings as Settings
  log.info(`getting devices from ${targetSettings.name}`)
  try {
    const myJDownloader = new MyJDownloader(settings.username, settings.password, APP_KEY, settings.timeout)
    await myJDownloader.connect()
    const devices = await myJDownloader.getDevices()
    await myJDownloader.disconnect()
    return devices
  } catch (e) {
    const error = e instanceof Error ? e : new Error('unknown error')
    log.error(`error while getting the devices from ${targetSettings.name}: ${error.message}`)
    throw error
  }
}

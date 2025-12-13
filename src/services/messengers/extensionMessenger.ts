import { defineExtensionMessaging, RemoveListenerCallback as RemoveListenerCallbackType } from '@webext-core/messaging'

import { Settings as GeneralSettings } from '@/services/general'
import { NZBFileObject } from '@/services/nzbfile'
import { TargetSettings } from '@/services/targets'
import { SerializedRequest, SerializedResponse } from '@/utils/fetchUtilities'

interface ProtocolMap {
  analyseTextSelection(data: { tabId: number }): void
  getGeneralSettings(data: boolean): Promise<GeneralSettings>
  searchNzbFile(data: { nzblnk: string; source: string }): void
  nzbFileDialog(data: { windowID: number }): NZBFileObject | NZBFileObject[]
  connectionTest(data: TargetSettings): Promise<boolean>
  fetchRequest(data: SerializedRequest): Promise<SerializedResponse | Error>
  heartbeat(data: null): void
}
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>()
export type RemoveListenerCallback = RemoveListenerCallbackType

import { defineExtensionMessaging, RemoveListenerCallback as RemoveListenerCallbackType } from '@webext-core/messaging'

import { Settings as GeneralSettings } from '@/services/general'
import {
  InterceptionRequest,
  InterceptionRequestFetchError,
  InterceptionRequestResponse,
} from '@/services/messengers/windowMessenger'
import { NZBFileObject } from '@/services/nzbfile'

interface ProtocolMap {
  interceptedRequest(data: InterceptionRequest): void
  interceptedRequestResponse(data: InterceptionRequestResponse): void
  interceptedRequestFetchError(data: InterceptionRequestFetchError): void
  analyseTextSelection(data: { tabId: number }): void
  getGeneralSettings(data: boolean): Promise<GeneralSettings>
  searchNzbFile(data: { nzblnk: string; source: string }): void
  nzbFileDialog(data: { windowID: number }): NZBFileObject | NZBFileObject[]
}
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>()
export type RemoveListenerCallback = RemoveListenerCallbackType

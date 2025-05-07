import { getSettings as getGeneralSettings } from '@/services/general'
import { onMessage } from '@/services/messengers/extensionMessenger'
import { NZBFileObject } from '@/services/nzbfile'

export default function (): void {
  onMessage('getGeneralSettings', async () => {
    const settings = await getGeneralSettings()
    return settings
  })
  onMessage('searchNzbFile', async (message) => {
    const nzbfile = await new NZBFileObject().init()
    nzbfile.processNzblnk(message.data.nzblnk, message.data.source)
  })
}

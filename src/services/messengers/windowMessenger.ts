import { defineWindowMessaging } from '@webext-core/messaging/page'

import { DomainSettings } from '@/services/interception'

const extensionId = 'nzbdonkey_webextension'

export type InterceptionRequest = {
  domain: string
  url: string
  options: RequestInit
  formData: string
  searchParams: string
  source: string
}

export type InterceptionRequestResponse = {
  text: string | undefined
  blob: string | undefined
  type: string | null
  filename: string
  domain: string
  url: string
  source: string
}

export type InterceptionRequestFetchError = {
  domain: string
  url: string
  error: Error
}

interface WebsiteMessengerSchema {
  getDomainSetting(data: string): void
  domainSetting(data: DomainSettings | undefined): void
  interceptedRequest(data: InterceptionRequest): void
  interceptedRequestResponse(data: InterceptionRequestResponse): void
  interceptedRequestFetchError(data: InterceptionRequestFetchError): void
}
export const websiteMessenger = defineWindowMessaging<WebsiteMessengerSchema>({
  namespace: extensionId,
})

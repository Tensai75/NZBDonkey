import { browser, Browser } from '#imports'

/**
 * Requests a browser permission.
 * @param {Browser.permissions.Permissions} permissions - The permissions to request.
 * @return {Promise<boolean>} Resolves to `true` if the permission is granted, otherwise `false`.
 * @throws {Error} Throws an error if the permission request fails.
 */
export async function requestPermission(permissions: Browser.permissions.Permissions): Promise<boolean> {
  return browser.permissions.request(permissions)
}

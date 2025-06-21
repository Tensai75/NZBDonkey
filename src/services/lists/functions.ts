import log from '@/services/logger/debugLogger'
import { useFetch } from '@/utils/fetchUtilities'

export const fetchAndValidateList = async <T>(
  url: string,
  expectedVersion: number,
  sortKey: keyof T,
  defaultList: { version: number; data: T[] }
): Promise<T[]> => {
  const fetchList = async (url: string): Promise<{ version: number; data: T[] }> => {
    const response = await useFetch(url)
    return await response.json()
  }

  const sortList = (data: T[], key: keyof T): T[] => {
    return data.sort((a, b) => {
      const aKey = a[key]
      const bKey = b[key]
      return typeof aKey === 'string' && typeof bKey === 'string' ? aKey.localeCompare(bKey) : 0
    })
  }

  try {
    const json = await fetchList(url)
    if (json.version !== expectedVersion) {
      throw new Error(`Version mismatch: expected ${expectedVersion}, got ${json.version}`)
    }
    return sortList(json.data, sortKey)
  } catch (error) {
    log.warn(`Error loading the list from URL: ${error instanceof Error ? error.message : 'unknown error'}`)
    return sortList(defaultList.data, sortKey)
  }
}

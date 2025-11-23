import log from '@/services/logger/debugLogger'
import { useFetch } from '@/utils/fetchUtilities'

export const fetchAndValidateList = async <T>(
  listname: string,
  url: string,
  expectedVersion: number,
  sortKey: keyof T,
  defaultList: { version: number; data: T[] },
  defaultKeys: (keyof T)[] = []
): Promise<T[]> => {
  const fetchList = async (url: string): Promise<{ version: number; data: T[] }> => {
    const response = await useFetch(url)
    return await response.json()
  }

  const filterKeys = (list: T[]): T[] => {
    if (defaultKeys.length === 0) {
      return list
    }
    return list.map((item: T) => {
      const filteredItem = {} as T
      for (const key of defaultKeys) {
        if (item[key] !== undefined) {
          filteredItem[key] = item[key]
        }
      }
      return filteredItem
    })
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
    return sortList(filterKeys(json.data), sortKey)
  } catch (e) {
    log.warn(`Error loading the ${listname} from URL: ${e instanceof Error ? e.message : String(e)}`)
    return sortList(filterKeys(defaultList.data), sortKey)
  }
}

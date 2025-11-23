import { browser, Browser } from '#imports'

/**
 * A utility function to handle try-catch logic for both synchronous and asynchronous operations.
 *
 * @template T - The type of the resolved value.
 * @template E - The type of the error (defaults to `Error`).
 * @param {Promise<T> | (() => T)} arg - A promise or a synchronous function to execute.
 * @return {Promise<{ data: T | null; error: E | null }>} If `arg` is a promise, returns a promise resolving to an object with `data` or `error`.
 * @return {{ data: T | null; error: E | null }} If `arg` is a synchronous function, returns an object with `data` or `error`.
 */
export const tryCatch = async <T, E = Error>(
  arg: Promise<T> | (() => T)
): Promise<{ data: T | null; error: E | null }> => {
  // Handle synchronous function
  if (typeof arg === 'function') {
    try {
      const data = (arg as () => T)()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e as E }
    }
  }

  // Handle asynchronous promise
  try {
    const data = await (arg as Promise<T>)
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e as E }
  }
}

/**
 * A utility function to debounce a function, ensuring it is only called after a specified delay
 * has passed since the last time it was invoked. Supports an option to execute immediately on the first call.
 *
 * @template T - The type of the function to debounce.
 * @param {T} fn - The function to debounce.
 * @param {number} delay - The delay in milliseconds to wait before invoking the function.
 * @param {boolean} [leading=false] - Whether to execute the function immediately on the first call.
 * @return {T} A debounced version of the input function.
 */
export function debounceVoid<T extends (...arg: Parameters<T>) => void>(fn: T, delay: number, leading = false): T {
  let timeoutId: number | undefined
  let isFirstCall = true
  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    if (leading && isFirstCall) {
      fn(...args)
      isFirstCall = false
    }
    timeoutId = window.setTimeout(() => {
      if (!leading) {
        fn(...args)
      }
      isFirstCall = true // Reset for the next debounce cycle
    }, delay)
  } as T
}

/**
 * A utility function to create a browser context menu using a Promise-based approach.
 * This wraps the callback-based `browser.contextMenus.create` method in a Promise,
 * allowing it to be used with `async/await`.
 *
 * @param {Browser.contextMenus.CreateProperties} options - The properties for the context menu to be created.
 * @return {Promise<void>} A Promise that resolves when the context menu is successfully created,
 * or rejects with an error if the creation fails.
 */
export function createContextMenuPromise(options: Browser.contextMenus.CreateProperties): Promise<void> {
  return new Promise((resolve, reject) => {
    browser.contextMenus.create(options, () => {
      if (browser.runtime.lastError) {
        reject(new Error(browser.runtime.lastError.message))
      } else {
        resolve()
      }
    })
  })
}

/**
 * A simple async semaphore for limiting concurrency.
 *
 * Usage:
 *   const semaphore = new Semaphore(5) // allow 5 concurrent tasks
 *   const release = await semaphore.acquire()
 *   try {
 *     // critical section
 *   } finally {
 *     release()
 *   }
 */
export class Semaphore {
  /**
   * Queue of waiting resolvers. Each queued function, when invoked, hands back
   * a release callback to the awaiting acquire() caller.
   */
  private q: Array<() => void> = []

  /**
   * Current number of acquired (in-use) permits.
   */
  private used = 0

  /**
   * Create a semaphore with a fixed maximum concurrency (capacity).
   * @param cap Maximum number of concurrent acquisitions allowed (> 0).
   */
  constructor(private cap: number) {}

  /**
   * Acquire a permit. If a permit is available, resolves immediately with a
   * release function. Otherwise waits until a permit is released.
   *
   * @returns Promise resolving to a release callback that MUST be called once.
   */
  async acquire(): Promise<() => void> {
    if (this.used < this.cap) {
      this.used++
      return () => this.release()
    }
    return await new Promise<() => void>((resolve) => {
      this.q.push(() => {
        this.used++
        resolve(() => this.release())
      })
    })
  }

  /**
   * Release a previously acquired permit and wake the next waiter (FIFO) if any.
   * (Internal – users call the release function returned by acquire()).
   */
  private release() {
    this.used--
    const next = this.q.shift()
    if (next) next()
  }
}

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
    } catch (error) {
      return { data: null, error: error as E }
    }
  }

  // Handle asynchronous promise
  try {
    const data = await (arg as Promise<T>)
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as E }
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

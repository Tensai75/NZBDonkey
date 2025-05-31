/**
 * Extracts the filename from a file path.
 * @param {string} path - The file path to extract the filename from.
 * @return {string} The extracted filename, or an empty string if none is found.
 */
export const getFileNameFromPath = (path: string): string => {
  return path.split('\\').pop()?.split('/').pop() ?? ''
}

/**
 * Extracts the basename (filename without extension) from a filename.
 * @param {string} filename - The filename to extract the basename from.
 * @return {string} The extracted basename, or the original filename if no extension is found.
 */
export const getBasenameFromFilename = (filename: string): string => {
  return filename.slice(0, filename.lastIndexOf('.'))
}

/**
 * Extracts the file extension from a filename.
 * @param {string} filename - The filename to extract the extension from.
 * @return {string} The extracted file extension, or an empty string if none is found.
 */
export const getExtensionFromFilename = (filename: string): string => {
  return filename.slice(filename.lastIndexOf('.') + 1)
}

/**
 * Formats a string as an error message by capitalizing the first letter
 * and appending an exclamation mark.
 * @param {string} input - The input string to format.
 * @return {string} The formatted error string, or an empty string if the input is empty.
 */
export const generateErrorString = (input: string): string => {
  if (!input) return ''
  // Remove punctuation marks at the end
  const sanitized = input.replace(/[.!]+$/g, '')
  // Capitalize the first character
  const capitalized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1)
  return `${capitalized}!`
}

/**
 * Encodes a Unicode string into a Base64-encoded string.
 * @param {string} string - The input string to encode.
 * @return {string} The Base64-encoded string.
 * @throws {Error} Throws an error if encoding fails.
 */
export const b64EncodeUnicode = (string: string): string => {
  try {
    return btoa(
      encodeURIComponent(string).replace(/%([0-9A-F]{2})/g, (_match, p1) => String.fromCharCode(parseInt(p1, 16)))
    )
  } catch {
    throw new Error('failed to encode string to Base64')
  }
}

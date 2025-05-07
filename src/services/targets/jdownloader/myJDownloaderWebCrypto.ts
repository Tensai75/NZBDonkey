/*** Cryptographic functions for the MyDownloader API but with native Web Crypto API ***/
export const sha256 = async (value: string): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodeUtf8(value))
  return uint8ArrayToHex(hashBuffer)
}

export const sha256UpdateKey = async (oldKey: string, newKey: string): Promise<string> => {
  const combinedBuffer = new Uint8Array([...hexToUint8Array(oldKey), ...hexToUint8Array(newKey)])
  const finalHash = await crypto.subtle.digest('SHA-256', combinedBuffer)
  return uint8ArrayToHex(finalHash)
}

export const hmacSha256 = async (key: string, value: string): Promise<string> => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    hexToUint8Array(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encodeUtf8(value))
  return uint8ArrayToHex(signature)
}

export const aesEncrypt = async (secret: string, value: object): Promise<string> => {
  const { iv, key } = extractAesKeyAndIv(secret)
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt'])
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    encodeUtf8(JSON.stringify(value))
  )
  return uint8ArrayToBase64(new Uint8Array(encryptedBuffer))
}

export const aesDecrypt = async (secret: string, value: string): Promise<string> => {
  const { iv, key } = extractAesKeyAndIv(secret)
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['decrypt'])
  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, base64ToUint8Array(value))
  return decodeUtf8(decryptedBuffer)
}

/*** Utility Functions ***/
const encodeUtf8 = (value: string): Uint8Array => {
  return new TextEncoder().encode(value)
}

const decodeUtf8 = (buffer: Uint8Array | ArrayBuffer): string => {
  return new TextDecoder().decode(buffer)
}

const hexToUint8Array = (hex: string): Uint8Array => {
  const match = hex.match(/.{1,2}/g)
  if (!match) {
    throw new Error('Invalid hex string')
  }
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)))
}

const uint8ArrayToHex = (buffer: Uint8Array | ArrayBuffer): string => {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const base64ToUint8Array = (base64: string): Uint8Array => {
  return new Uint8Array([...atob(base64)].map((char) => char.charCodeAt(0)))
}

const uint8ArrayToBase64 = (uint8Array: Uint8Array): string => {
  let binary = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  return btoa(binary)
}

const extractAesKeyAndIv = (secret: string): { iv: Uint8Array; key: Uint8Array } => {
  return {
    iv: hexToUint8Array(secret.substring(0, 32)),
    key: hexToUint8Array(secret.substring(32)),
  }
}

export default { sha256, sha256UpdateKey, hmacSha256, aesEncrypt, aesDecrypt }

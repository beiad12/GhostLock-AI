/**
 * AES-256-GCM encryption for locally-stored face embeddings and profile data.
 * Uses the Web Crypto API — nothing ever leaves the device.
 *
 * The vault key is generated once per install and stored via Electron's
 * userData directory (through the `window.api` bridge), not in localStorage,
 * so it survives renderer reloads but never touches the network.
 */

const AES_ALGO = 'AES-GCM'
const KEY_LENGTH = 256

export interface EncryptedPayload {
  ciphertext: string
  iv: string
}

async function importKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', rawKey, AES_ALGO, false, ['encrypt', 'decrypt'])
}

/** Generates a fresh 256-bit key and returns it as base64 for persistence. */
export async function generateVaultKey(): Promise<string> {
  const key = await crypto.subtle.generateKey({ name: AES_ALGO, length: KEY_LENGTH }, true, [
    'encrypt',
    'decrypt'
  ])
  const raw = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToBase64(raw)
}

export async function encryptJson(value: unknown, base64Key: string): Promise<EncryptedPayload> {
  const key = await importKey(base64ToArrayBuffer(base64Key))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt({ name: AES_ALGO, iv }, key, plaintext)
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer)
  }
}

export async function decryptJson<T>(payload: EncryptedPayload, base64Key: string): Promise<T> {
  const key = await importKey(base64ToArrayBuffer(base64Key))
  const iv = base64ToArrayBuffer(payload.iv)
  const ciphertext = base64ToArrayBuffer(payload.ciphertext)
  const plaintext = await crypto.subtle.decrypt(
    { name: AES_ALGO, iv: new Uint8Array(iv) },
    key,
    ciphertext
  )
  return JSON.parse(new TextDecoder().decode(plaintext)) as T
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

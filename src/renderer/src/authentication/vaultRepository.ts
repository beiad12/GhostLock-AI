import {
  generateVaultKey,
  encryptJson,
  decryptJson,
  arrayBufferToBase64,
  base64ToArrayBuffer
} from '../encryption/vault'
import type { EnrolledUser, AttemptLogEntry } from '../types/auth'

const KEY_FILE = 'key.b64'
const USERS_FILE = 'users.enc.json'
const LOG_FILE = 'attempts.enc.json'

let cachedKey: string | null = null

/** Retrieves the AES vault key from the OS-protected userData dir, generating one on first run. */
export async function getOrCreateVaultKey(): Promise<string> {
  if (cachedKey) return cachedKey
  const existing = await window.api.vault.read(KEY_FILE)
  if (existing) {
    cachedKey = existing
    return existing
  }
  const key = await generateVaultKey()
  await window.api.vault.write(KEY_FILE, key)
  cachedKey = key
  return key
}

/**
 * Drops the in-memory vault key cache so the next read picks up whatever is
 * currently on disk. Must be called after importing a profile bundle that
 * overwrites key.b64 — otherwise subsequent reads keep using the old
 * session's cached key and silently fail to decrypt the freshly-imported
 * data (loadEnrolledUsers/loadAttemptLog swallow decrypt errors and just
 * return empty, so the import would look like it silently did nothing).
 */
export function invalidateVaultKeyCache(): void {
  cachedKey = null
}

export async function loadEnrolledUsers(): Promise<EnrolledUser[]> {
  const key = await getOrCreateVaultKey()
  const raw = await window.api.vault.read(USERS_FILE)
  if (!raw) return []
  try {
    return await decryptJson<EnrolledUser[]>(JSON.parse(raw), key)
  } catch {
    return []
  }
}

export async function saveEnrolledUsers(users: EnrolledUser[]): Promise<void> {
  const key = await getOrCreateVaultKey()
  const payload = await encryptJson(users, key)
  await window.api.vault.write(USERS_FILE, JSON.stringify(payload))
}

export async function encodeEmbedding(embedding: Float32Array): Promise<string> {
  return arrayBufferToBase64(embedding.buffer as ArrayBuffer)
}

export function decodeEmbedding(base64: string): Float32Array {
  return new Float32Array(base64ToArrayBuffer(base64))
}

export async function loadAttemptLog(): Promise<AttemptLogEntry[]> {
  const key = await getOrCreateVaultKey()
  const raw = await window.api.vault.read(LOG_FILE)
  if (!raw) return []
  try {
    return await decryptJson<AttemptLogEntry[]>(JSON.parse(raw), key)
  } catch {
    return []
  }
}

export async function saveAttemptLog(entries: AttemptLogEntry[]): Promise<void> {
  const key = await getOrCreateVaultKey()
  const payload = await encryptJson(entries, key)
  await window.api.vault.write(LOG_FILE, JSON.stringify(payload))
}

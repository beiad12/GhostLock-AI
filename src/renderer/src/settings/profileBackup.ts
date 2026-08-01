/**
 * Export/import of the local encrypted profile vault as a single portable
 * file. The bundle carries the AES-256 vault key alongside the ciphertext so
 * it can be restored on this or another GhostLock AI install — treat the
 * exported file itself as a secret, the same way you would a password vault
 * export. (A future revision should let the user wrap the export under a
 * separate passphrase-derived key instead of the raw device vault key.)
 */

import { invalidateVaultKeyCache } from '../authentication/vaultRepository'

interface VaultBundle {
  version: 1
  exportedAt: number
  vaultKey: string
  usersFile: string | null
  attemptsFile: string | null
}

export async function exportProfileBundle(): Promise<void> {
  const vaultKey = await window.api.vault.read('key.b64')
  const usersFile = await window.api.vault.read('users.enc.json')
  const attemptsFile = await window.api.vault.read('attempts.enc.json')

  if (!vaultKey) throw new Error('No vault key found on this device yet')

  const bundle: VaultBundle = {
    version: 1,
    exportedAt: Date.now(),
    vaultKey,
    usersFile,
    attemptsFile
  }

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ghostlock-profile-${new Date().toISOString().slice(0, 10)}.glvault`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importProfileBundle(file: File): Promise<void> {
  const text = await file.text()
  const bundle = JSON.parse(text) as VaultBundle
  if (bundle.version !== 1 || !bundle.vaultKey) {
    throw new Error('Unrecognized or corrupt vault bundle')
  }

  await window.api.vault.write('key.b64', bundle.vaultKey)
  if (bundle.usersFile) await window.api.vault.write('users.enc.json', bundle.usersFile)
  if (bundle.attemptsFile) await window.api.vault.write('attempts.enc.json', bundle.attemptsFile)
  invalidateVaultKeyCache()
}

import { app } from 'electron'
import { join } from 'path'
import { mkdir, readFile, writeFile } from 'fs/promises'

/**
 * Persists the AES-256 vault key and encrypted profile data inside Electron's
 * per-user `userData` directory (OS-protected, outside any web-reachable
 * storage). Encryption/decryption itself happens in the renderer via
 * `encryption/vault.ts` — this module only reads and writes opaque blobs.
 */

async function vaultDir(): Promise<string> {
  const dir = join(app.getPath('userData'), 'vault')
  await mkdir(dir, { recursive: true })
  return dir
}

export async function readVaultFile(name: string): Promise<string | null> {
  try {
    const dir = await vaultDir()
    return await readFile(join(dir, name), 'utf-8')
  } catch {
    return null
  }
}

export async function writeVaultFile(name: string, contents: string): Promise<void> {
  const dir = await vaultDir()
  await writeFile(join(dir, name), contents, 'utf-8')
}

import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../shared/ipcChannels'
import { readVaultFile, writeVaultFile } from './windowsIntegration/vaultStorage'
import { getAutoLaunchEnabled, setAutoLaunchEnabled } from './windowsIntegration/autoLaunch'
import { getSystemStats } from './windowsIntegration/systemStats'
import {
  verifyLivenessWithMistral,
  type MistralLivenessResult
} from './windowsIntegration/mistralClient'
import { app } from 'electron'

export function registerIpcHandlers(
  getMainWindow: () => BrowserWindow | null,
  requestQuit: () => void,
  setAuthState: (authenticated: boolean) => void,
  getAuthState: () => boolean
): void {
  ipcMain.handle(IPC.VAULT_READ, (_event, name: string) => readVaultFile(name))
  ipcMain.handle(IPC.VAULT_WRITE, (_event, name: string, contents: string) =>
    writeVaultFile(name, contents)
  )

  ipcMain.handle(IPC.AUTO_LAUNCH_GET, () => getAutoLaunchEnabled())
  ipcMain.handle(IPC.AUTO_LAUNCH_SET, (_event, enabled: boolean) => setAutoLaunchEnabled(enabled))

  ipcMain.handle(IPC.SYSTEM_STATS, () => getSystemStats())

  ipcMain.handle(IPC.APP_VERSION, () => app.getVersion())

  ipcMain.handle(IPC.UNLOCK_DESKTOP, () => {
    const win = getMainWindow()
    if (!win) return
    win.setKiosk(false)
    win.setAlwaysOnTop(false)
    win.setFullScreen(false)
  })

  ipcMain.handle(IPC.LOCK_DESKTOP, () => {
    const win = getMainWindow()
    if (!win) return
    win.setFullScreen(true)
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setKiosk(true)
  })

  // Both of these are no-ops while unauthenticated — there is no way to
  // hide or exit GhostLock AI until an authenticated session is active.
  ipcMain.handle(IPC.HIDE_TO_TRAY, () => {
    if (!getAuthState()) return
    getMainWindow()?.hide()
  })

  ipcMain.handle(IPC.QUIT_APP, () => {
    requestQuit()
  })

  ipcMain.handle(IPC.SET_AUTH_STATE, (_event, authenticated: boolean) => {
    setAuthState(authenticated)
  })

  // Never throws to the renderer — a bad key, no internet, or a Mistral
  // outage must never be able to block a real user from unlocking their own
  // machine. Failures come back as { error } instead of a rejected promise.
  ipcMain.handle(
    IPC.MISTRAL_VERIFY,
    async (
      _event,
      apiKey: string,
      imageDataUrl: string
    ): Promise<MistralLivenessResult | { error: string }> => {
      try {
        return await verifyLivenessWithMistral(apiKey, imageDataUrl)
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown Mistral error' }
      }
    }
  )
}

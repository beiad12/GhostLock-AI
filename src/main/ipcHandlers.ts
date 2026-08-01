import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../shared/ipcChannels'
import { readVaultFile, writeVaultFile } from './windowsIntegration/vaultStorage'
import { getAutoLaunchEnabled, setAutoLaunchEnabled } from './windowsIntegration/autoLaunch'
import { getSystemStats } from './windowsIntegration/systemStats'
import { app } from 'electron'

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
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
}

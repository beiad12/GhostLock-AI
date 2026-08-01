import { app } from 'electron'

/** Reads whether GhostLock AI is registered to launch at Windows login. */
export function getAutoLaunchEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin
}

/** Registers or unregisters GhostLock AI as a login item via the real OS API. */
export function setAutoLaunchEnabled(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    // Launch straight into the lock screen, hidden from the taskbar until shown.
    args: ['--locked-start']
  })
}

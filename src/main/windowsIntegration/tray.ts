import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'
import icon from '../../../resources/icon.png?asset'

/**
 * System tray icon so GhostLock AI can run in the background after the user
 * hides its window, rather than only ever being fully open or fully quit.
 */
export function createTray(
  getMainWindow: () => BrowserWindow | null,
  requestQuit: () => void
): Tray {
  const tray = new Tray(nativeImage.createFromPath(icon))
  tray.setToolTip('GhostLock AI — running in the background')

  const showWindow = (): void => {
    const win = getMainWindow()
    if (!win) return
    win.show()
    win.focus()
  }

  // Quit is deliberately ALWAYS available here, regardless of auth state.
  // A lock screen with literally no escape hatch is a real hazard, not a
  // security feature — if face recognition misfires, this is what stops
  // it from being a permanent lockout. The in-window close button is still
  // gated on authentication; this tray item is the guaranteed way out.
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open GhostLock AI', click: showWindow },
      { type: 'separator' },
      { label: 'Quit GhostLock AI', click: requestQuit }
    ])
  )

  tray.on('click', showWindow)

  app.on('before-quit', () => tray.destroy())

  return tray
}

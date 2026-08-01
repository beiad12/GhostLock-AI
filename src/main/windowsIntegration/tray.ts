import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'
import icon from '../../../resources/icon.png?asset'

/**
 * System tray icon so GhostLock AI can run in the background after the user
 * hides its window, rather than only ever being fully open or fully quit.
 */
export function createTray(
  getMainWindow: () => BrowserWindow | null,
  requestQuit: () => void,
  getAuthState: () => boolean
): Tray {
  const tray = new Tray(nativeImage.createFromPath(icon))
  tray.setToolTip('GhostLock AI — running in the background')

  const showWindow = (): void => {
    const win = getMainWindow()
    if (!win) return
    win.show()
    win.focus()
  }

  // Rebuilt right before it's shown so the Quit item's enabled state always
  // reflects the current auth state — quitting is only possible once
  // authenticated.
  const rebuildMenu = (): void => {
    const authenticated = getAuthState()
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Open GhostLock AI', click: showWindow },
        { type: 'separator' },
        {
          label: authenticated ? 'Quit GhostLock AI' : 'Quit (unlock required)',
          enabled: authenticated,
          click: requestQuit
        }
      ])
    )
  }

  tray.on('click', showWindow)
  tray.on('right-click', rebuildMenu)
  rebuildMenu()

  app.on('before-quit', () => tray.destroy())

  return tray
}

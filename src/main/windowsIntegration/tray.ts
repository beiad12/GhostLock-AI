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

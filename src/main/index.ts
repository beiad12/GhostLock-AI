import { app, shell, BrowserWindow, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from './ipcHandlers'
import { createTray } from './windowsIntegration/tray'

let mainWindow: BrowserWindow | null = null
let isQuitting = false
// Mirrors the renderer's auth state (set via IPC whenever it changes). Both
// the tray's Quit item and the window's close/hide behavior are gated on
// this so there is no way to exit or background the app before an
// authenticated session — the whole point of a lock screen.
let isAuthenticated = false

function setAuthState(authenticated: boolean): void {
  isAuthenticated = authenticated
}

function getAuthState(): boolean {
  return isAuthenticated
}

function requestQuit(): void {
  if (!isAuthenticated) return
  isQuitting = true
  app.quit()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    frame: false,
    fullscreen: true,
    kiosk: !is.dev,
    alwaysOnTop: !is.dev,
    autoHideMenuBar: true,
    backgroundColor: '#050505',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // GhostLock AI is meant to keep running as a background security service,
  // and the whole point of a lock screen is that it can't be dismissed
  // before authentication: an unauthenticated close is fully swallowed
  // (window stays visible and locked). Once authenticated, closing hides
  // to the tray instead of exiting the process; a full exit only happens
  // via the tray's "Quit" item.
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    if (isAuthenticated) {
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.ghostlock.ai')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers(() => mainWindow, requestQuit, setAuthState, getAuthState)
  createWindow()
  createTray(() => mainWindow, requestQuit, getAuthState)

  // Development-only escape hatch so kiosk mode never traps a dev session.
  if (is.dev) {
    globalShortcut.register('CommandOrControl+Shift+Q', () => {
      isQuitting = true
      app.quit()
    })
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

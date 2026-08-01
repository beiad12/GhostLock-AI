import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '../shared/ipcChannels'
import type { SystemStatsSnapshot } from '../main/windowsIntegration/systemStats'

const api = {
  vault: {
    read: (name: string): Promise<string | null> => ipcRenderer.invoke(IPC.VAULT_READ, name),
    write: (name: string, contents: string): Promise<void> =>
      ipcRenderer.invoke(IPC.VAULT_WRITE, name, contents)
  },
  autoLaunch: {
    get: (): Promise<boolean> => ipcRenderer.invoke(IPC.AUTO_LAUNCH_GET),
    set: (enabled: boolean): Promise<void> => ipcRenderer.invoke(IPC.AUTO_LAUNCH_SET, enabled)
  },
  system: {
    stats: (): Promise<SystemStatsSnapshot> => ipcRenderer.invoke(IPC.SYSTEM_STATS)
  },
  window: {
    unlockDesktop: (): Promise<void> => ipcRenderer.invoke(IPC.UNLOCK_DESKTOP),
    lockDesktop: (): Promise<void> => ipcRenderer.invoke(IPC.LOCK_DESKTOP),
    hideToTray: (): Promise<void> => ipcRenderer.invoke(IPC.HIDE_TO_TRAY)
  },
  app: {
    version: (): Promise<string> => ipcRenderer.invoke(IPC.APP_VERSION),
    quit: (): Promise<void> => ipcRenderer.invoke(IPC.QUIT_APP),
    setAuthState: (authenticated: boolean): Promise<void> =>
      ipcRenderer.invoke(IPC.SET_AUTH_STATE, authenticated)
  }
}

export type GhostLockApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

import { ElectronAPI } from '@electron-toolkit/preload'
import type { GhostLockApi } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: GhostLockApi
  }
}

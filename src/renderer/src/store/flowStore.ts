import { create } from 'zustand'

export type AppStage =
  'boot' | 'enroll' | 'scan' | 'granted' | 'denied' | 'unlocked' | 'intruderLock'

interface FlowStore {
  stage: AppStage
  settingsOpen: boolean
  lastAuthenticatedUser: string | null
  lastConfidence: number
  lastDenialReason: string | null
  goTo: (stage: AppStage) => void
  setSettingsOpen: (open: boolean) => void
  setAuthResult: (userName: string | null, confidence: number, reason?: string | null) => void
}

export const useFlowStore = create<FlowStore>((set) => ({
  stage: 'boot',
  settingsOpen: false,
  lastAuthenticatedUser: null,
  lastConfidence: 0,
  lastDenialReason: null,
  goTo: (stage) => set({ stage }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setAuthResult: (userName, confidence, reason = null) =>
    set({ lastAuthenticatedUser: userName, lastConfidence: confidence, lastDenialReason: reason })
}))

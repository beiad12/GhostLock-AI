import { create } from 'zustand'

export type AppStage = 'boot' | 'enroll' | 'scan' | 'granted' | 'denied' | 'unlocked'

interface FlowStore {
  stage: AppStage
  settingsOpen: boolean
  lastAuthenticatedUser: string | null
  lastConfidence: number
  goTo: (stage: AppStage) => void
  setSettingsOpen: (open: boolean) => void
  setAuthResult: (userName: string | null, confidence: number) => void
}

export const useFlowStore = create<FlowStore>((set) => ({
  stage: 'boot',
  settingsOpen: false,
  lastAuthenticatedUser: null,
  lastConfidence: 0,
  goTo: (stage) => set({ stage }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setAuthResult: (userName, confidence) =>
    set({ lastAuthenticatedUser: userName, lastConfidence: confidence })
}))

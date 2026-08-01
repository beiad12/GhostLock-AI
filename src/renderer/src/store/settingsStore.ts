import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SETTINGS, type AppSettings } from '../types/settings'
import { applyTheme } from '../themes/applyTheme'
import { setMasterVolume } from '../audio/soundEngine'
import type { ThemeId } from '../themes/types'

interface SettingsStore {
  settings: AppSettings
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  setTheme: (theme: ThemeId) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      update: (key, value) => {
        set({ settings: { ...get().settings, [key]: value } })
        if (key === 'masterVolume') setMasterVolume(value as number)
      },
      setTheme: (theme) => {
        set({ settings: { ...get().settings, theme } })
        applyTheme(theme)
      },
      reset: () => {
        set({ settings: DEFAULT_SETTINGS })
        applyTheme(DEFAULT_SETTINGS.theme)
      }
    }),
    { name: 'ghostlock-settings' }
  )
)

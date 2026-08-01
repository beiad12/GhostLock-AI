import type { ThemeId } from '../themes/types'

export type AnimationIntensity = 'low' | 'balanced' | 'high'

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja'

export interface AppSettings {
  theme: ThemeId
  sensitivity: number
  confidenceThreshold: number
  animationIntensity: AnimationIntensity
  voiceEnabled: boolean
  soundsEnabled: boolean
  masterVolume: number
  autoStartup: boolean
  notificationsEnabled: boolean
  cameraDeviceId: string | null
  language: Language
  maxFailedAttempts: number
  autoLockMinutes: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'cyberGreen',
  sensitivity: 70,
  confidenceThreshold: 82,
  animationIntensity: 'high',
  voiceEnabled: true,
  soundsEnabled: true,
  masterVolume: 70,
  autoStartup: true,
  notificationsEnabled: true,
  cameraDeviceId: null,
  language: 'en',
  maxFailedAttempts: 3,
  autoLockMinutes: 5
}

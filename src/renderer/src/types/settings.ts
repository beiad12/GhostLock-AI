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
  // Tuned for RealFaceAuthProvider's euclidean-distance-based confidence —
  // see its doc comment. Deliberately lenient by default: a real first
  // real-camera test showed the untested 55 default was too strict and
  // rejected the legitimate enrolled user. Raise this in Settings once
  // you've confirmed impostor faces are still rejected on your hardware.
  confidenceThreshold: 40,
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

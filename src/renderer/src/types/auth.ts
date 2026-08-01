export type LivenessChallengeKind = 'blink' | 'turnLeft' | 'turnRight' | 'lookUp' | 'smile'

export interface LivenessChallenge {
  kind: LivenessChallengeKind
  label: string
}

export type ScanPhase =
  'idle' | 'detecting' | 'analyzing' | 'liveness' | 'matching' | 'granted' | 'denied'

export interface FaceMetrics {
  boundingBox: { x: number; y: number; width: number; height: number }
  eyeDistance: number
  yaw: number
  pitch: number
  roll: number
  livenessScore: number
  identityConfidence: number
}

export interface AuthAttemptResult {
  success: boolean
  userName: string | null
  confidence: number
  timestamp: number
}

export interface EnrolledUser {
  id: string
  name: string
  createdAt: number
  /**
   * Base64-encoded biometric embedding. Never a raw image — and this record
   * is only ever persisted as part of an AES-256-GCM encrypted vault file
   * (see `authentication/vaultRepository.ts`), never in plaintext on disk.
   */
  embeddingBase64: string
}

export interface AttemptLogEntry {
  id: string
  timestamp: number
  success: boolean
  userName: string | null
  confidence: number
  reason?: string
}

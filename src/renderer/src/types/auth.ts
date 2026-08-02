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
   * Base64-encoded biometric embeddings, one per captured enrollment angle
   * (left/right/up/down/smile/blink) — never a raw image, and only ever
   * persisted as part of an AES-256-GCM encrypted vault file (see
   * `authentication/vaultRepository.ts`), never in plaintext on disk.
   *
   * Stored as a gallery (one descriptor per pose) rather than a single
   * averaged embedding: averaging descriptors from very different head
   * angles together dilutes the representation and pulls it away from
   * what a normal frontal live scan looks like, making matching *worse*.
   * At match time the live descriptor is compared against every entry
   * here and the best (closest) one wins.
   */
  embeddingsBase64: string[]
}

export interface AttemptLogEntry {
  id: string
  timestamp: number
  success: boolean
  userName: string | null
  confidence: number
  reason?: string
}

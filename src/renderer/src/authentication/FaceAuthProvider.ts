import type { FaceMetrics, LivenessChallengeKind } from '../types/auth'

/**
 * Contract every face-authentication backend must satisfy.
 *
 * `RealFaceAuthProvider` is the default: real on-device face detection,
 * 68-point landmarks, and 128-d recognition descriptors via
 * @vladmandic/face-api (TensorFlow.js), matched with euclidean distance —
 * genuinely offline, genuinely comparing faces, no cloud calls.
 * `MockFaceAuthProvider` still exists as a camera-less fallback for demoing
 * the UI/animations without a webcam. Both implement this same interface,
 * so nothing outside `authentication/` needs to change to swap between them
 * — or to a future, more accurate engine (e.g. InsightFace/ONNX Runtime via
 * a local IPC/socket) later.
 */
export interface FaceAuthProvider {
  /** Starts continuous face detection on the given video element. */
  startDetection(video: HTMLVideoElement): Promise<void>
  /** Stops detection and releases any backend resources. */
  stopDetection(): Promise<void>
  /** Returns the latest computed face metrics, or null if no face is present. */
  getLatestMetrics(): FaceMetrics | null
  /**
   * Generates a biometric embedding from the current frame — used both for
   * enrollment and to capture the one live descriptor a match is judged
   * against. Deliberately NOT "matchEmbedding(stored)": capturing once and
   * comparing the result against every stored descriptor in a user's
   * gallery (via `matchConfidence`) avoids re-triggering the camera/model
   * once per stored descriptor, which would be both slow and prone to
   * comparing against inconsistent live frames.
   */
  captureEmbedding(): Promise<Float32Array>
  /** Evaluates whether the current live face satisfies a liveness challenge. */
  evaluateLivenessChallenge(kind: LivenessChallengeKind): Promise<boolean>
  /** Feeds the HUD's identity-confidence gauge after the caller computes a
   * match result (via `matchConfidence`) against the current live capture. */
  reportIdentityConfidence(confidence: number): void
}

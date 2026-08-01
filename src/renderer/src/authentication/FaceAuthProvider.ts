import type { FaceMetrics, LivenessChallengeKind } from '../types/auth'

/**
 * Contract every face-authentication backend must satisfy.
 *
 * Milestone 1 ships `MockFaceAuthProvider`, which drives the full cinematic
 * UI/UX with plausible, animated metrics but no real biometric matching.
 *
 * Milestone 2 swaps this for a provider backed by a local Python service
 * (OpenCV + MediaPipe for landmarks/liveness, InsightFace + ONNX Runtime for
 * embeddings) communicating over a local IPC/socket. No renderer or main
 * process code outside this interface needs to change.
 */
export interface FaceAuthProvider {
  /** Starts continuous face detection on the given video element. */
  startDetection(video: HTMLVideoElement): Promise<void>
  /** Stops detection and releases any backend resources. */
  stopDetection(): Promise<void>
  /** Returns the latest computed face metrics, or null if no face is present. */
  getLatestMetrics(): FaceMetrics | null
  /** Generates a biometric embedding from the current frame for enrollment. */
  captureEmbedding(): Promise<Float32Array>
  /** Compares the current live face against a stored embedding. */
  matchEmbedding(stored: Float32Array): Promise<{ confidence: number }>
  /** Evaluates whether the current live face satisfies a liveness challenge. */
  evaluateLivenessChallenge(kind: LivenessChallengeKind): Promise<boolean>
}

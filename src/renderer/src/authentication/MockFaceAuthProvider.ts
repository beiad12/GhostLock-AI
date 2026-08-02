import type { FaceAuthProvider } from './FaceAuthProvider'
import type { FaceMetrics, LivenessChallengeKind } from '../types/auth'

/**
 * Simulated face-authentication backend for milestone 1.
 *
 * Drives realistic-looking, continuously-updating metrics off a lightweight
 * animation loop so the scanning HUD has real, moving data to render, while
 * no actual biometric computation happens. See `FaceAuthProvider` for the
 * swap-in contract the real engine will implement.
 */
export class MockFaceAuthProvider implements FaceAuthProvider {
  private tickIntervalId: number | null = null
  private metrics: FaceMetrics | null = null
  private startTime = 0
  private faceDetected = false

  async startDetection(video: HTMLVideoElement): Promise<void> {
    void video
    this.startTime = performance.now()
    this.faceDetected = false

    // Simulate the "acquiring lock" delay before a face is confidently found.
    window.setTimeout(() => {
      this.faceDetected = true
    }, 900)

    // Consumers only poll every ~250ms, so recomputing at 60fps via
    // requestAnimationFrame would be pure wasted CPU; a plain interval at
    // the consumer's cadence is enough for the sine-wave jitter to read as
    // "live" without burning a frame budget in the background.
    this.tickIntervalId = window.setInterval(() => {
      this.metrics = this.faceDetected ? this.computeSimulatedMetrics() : null
    }, 200)
  }

  async stopDetection(): Promise<void> {
    if (this.tickIntervalId !== null) window.clearInterval(this.tickIntervalId)
    this.tickIntervalId = null
    this.metrics = null
  }

  getLatestMetrics(): FaceMetrics | null {
    return this.metrics
  }

  async captureEmbedding(): Promise<Float32Array> {
    // Deterministic-ish pseudo embedding derived from current metrics, purely
    // so enrollment -> matching round-trips consistently within a session.
    const seedBase = this.metrics
      ? this.metrics.eyeDistance + this.metrics.yaw
      : Math.random() * 100
    const embedding = new Float32Array(128)
    let seed = seedBase * 1000
    for (let i = 0; i < embedding.length; i++) {
      seed = (seed * 9301 + 49297) % 233280
      embedding[i] = seed / 233280
    }
    return embedding
  }

  async evaluateLivenessChallenge(kind: LivenessChallengeKind): Promise<boolean> {
    void kind
    await delay(1100 + Math.random() * 700)
    return Math.random() > 0.08
  }

  reportIdentityConfidence(confidence: number): void {
    void confidence
    // No-op: the mock's HUD gauge already fakes a plausible value in
    // computeSimulatedMetrics, independent of any real match result.
  }

  private computeSimulatedMetrics(): FaceMetrics {
    const t = (performance.now() - this.startTime) / 1000
    const jitter = (amplitude: number, speed: number): number => Math.sin(t * speed) * amplitude

    return {
      boundingBox: {
        x: 0.28 + jitter(0.01, 0.6),
        y: 0.18 + jitter(0.01, 0.5),
        width: 0.44 + jitter(0.005, 0.4),
        height: 0.56 + jitter(0.005, 0.4)
      },
      eyeDistance: 62 + jitter(1.5, 0.7),
      yaw: jitter(4, 0.3),
      pitch: jitter(3, 0.25),
      roll: jitter(2, 0.35),
      livenessScore: 90 + jitter(6, 1.1),
      identityConfidence: 84 + jitter(8, 0.9)
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

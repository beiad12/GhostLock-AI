import * as faceapi from '@vladmandic/face-api'
import type { FaceAuthProvider } from './FaceAuthProvider'
import type { FaceMetrics, LivenessChallengeKind } from '../types/auth'
import { loadFaceModels } from './faceApiModels'
import { averageEyeAspectRatio, yawEstimate, pitchEstimate, mouthAspectRatio } from './faceGeometry'
import { useSettingsStore } from '../store/settingsStore'

/**
 * The "Sensitivity" setting drives how readily the detector considers
 * something a face at all (the score threshold), independent of
 * "Confidence Threshold" which drives whether a detected face is judged to
 * be *the enrolled* face. Higher sensitivity = lower score threshold =
 * detects faces more readily (useful in poor lighting), at the cost of
 * being more prone to false detections.
 */
function detectorScoreThreshold(): number {
  const sensitivity = useSettingsStore.getState().settings.sensitivity
  return clamp(0.2, 0.7, 0.7 - (sensitivity / 100) * 0.5)
}

// Used for anything that feeds the actual accept/reject decision (matching,
// enrollment, liveness geometry) — higher input size for better accuracy.
function detectorOptions(): faceapi.TinyFaceDetectorOptions {
  return new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: detectorScoreThreshold()
  })
}
// Used only for the live HUD bounding box / metrics display, which doesn't
// feed any security decision — a smaller input size trades a little
// precision for a noticeably snappier-feeling tracking loop.
function hudDetectorOptions(): faceapi.TinyFaceDetectorOptions {
  return new faceapi.TinyFaceDetectorOptions({
    inputSize: 160,
    scoreThreshold: detectorScoreThreshold()
  })
}

/**
 * Real, on-device face authentication backed by @vladmandic/face-api
 * (TensorFlow.js). Detection, 68-point landmarks, and 128-d recognition
 * descriptors all run locally against models bundled with the app —
 * nothing is ever sent over the network.
 *
 * Fails closed throughout: if models aren't loaded or no face is found,
 * matching returns 0 confidence and liveness challenges return false,
 * rather than silently granting access.
 */
export class RealFaceAuthProvider implements FaceAuthProvider {
  private video: HTMLVideoElement | null = null
  private metricsIntervalId: number | null = null
  private metrics: FaceMetrics | null = null
  private lastIdentityConfidence = 0

  async startDetection(video: HTMLVideoElement): Promise<void> {
    await loadFaceModels()
    this.video = video

    this.metricsIntervalId = window.setInterval(async () => {
      if (!this.video) return
      try {
        const result = await faceapi
          .detectSingleFace(this.video, hudDetectorOptions())
          .withFaceLandmarks()
        this.metrics = result ? this.toFaceMetrics(result) : null
      } catch (err) {
        console.error('[RealFaceAuthProvider] metrics detection failed', err)
        this.metrics = null
      }
    }, 250)
  }

  async stopDetection(): Promise<void> {
    if (this.metricsIntervalId !== null) window.clearInterval(this.metricsIntervalId)
    this.metricsIntervalId = null
    this.metrics = null
    this.video = null
  }

  getLatestMetrics(): FaceMetrics | null {
    return this.metrics
  }

  async captureEmbedding(): Promise<Float32Array> {
    const descriptor = await this.detectDescriptorWithRetry()
    if (!descriptor) {
      throw new Error(
        'No face detected clearly enough to enroll — try better lighting and face the camera directly.'
      )
    }
    return descriptor
  }

  /** Lets the caller feed the HUD confidence gauge after comparing a
   * captured descriptor against a user's stored gallery via
   * `matchConfidence` — this class no longer does that comparison itself. */
  reportIdentityConfidence(confidence: number): void {
    this.lastIdentityConfidence = confidence
  }

  async evaluateLivenessChallenge(kind: LivenessChallengeKind): Promise<boolean> {
    if (!this.video) return false

    const samples: Array<{
      ear: number
      yaw: number
      pitch: number
      mouth: number
    }> = []

    const sampleWindowMs = 1400
    const sampleIntervalMs = 90
    const steps = Math.floor(sampleWindowMs / sampleIntervalMs)

    for (let i = 0; i < steps; i++) {
      try {
        const result = await faceapi
          .detectSingleFace(this.video, detectorOptions())
          .withFaceLandmarks()
        if (result) {
          samples.push({
            ear: averageEyeAspectRatio(
              result.landmarks.getLeftEye(),
              result.landmarks.getRightEye()
            ),
            yaw: yawEstimate(
              result.landmarks.getLeftEye(),
              result.landmarks.getRightEye(),
              result.landmarks.getNose()
            ),
            pitch: pitchEstimate(
              result.landmarks.getLeftEye(),
              result.landmarks.getRightEye(),
              result.landmarks.getNose()
            ),
            mouth: mouthAspectRatio(result.landmarks.getMouth())
          })
        }
      } catch (err) {
        console.error('[RealFaceAuthProvider] liveness sample failed', err)
      }
      await delay(sampleIntervalMs)
    }

    if (samples.length < steps * 0.4) return false // face wasn't tracked reliably enough to judge

    const baseline = samples[0]

    // Thresholds loosened from their initial untested values after a real
    // first camera test showed the enrolled user getting rejected. Still
    // real geometry, just more forgiving margins — tighten these back up
    // once you've confirmed genuine liveness (a photo/video) still fails.
    switch (kind) {
      case 'blink': {
        const minEar = Math.min(...samples.map((s) => s.ear))
        return minEar < baseline.ear * 0.82
      }
      case 'turnLeft': {
        const minYaw = Math.min(...samples.map((s) => s.yaw))
        return minYaw < baseline.yaw - 0.05
      }
      case 'turnRight': {
        const maxYaw = Math.max(...samples.map((s) => s.yaw))
        return maxYaw > baseline.yaw + 0.05
      }
      case 'lookUp': {
        const minPitch = Math.min(...samples.map((s) => s.pitch))
        return minPitch < baseline.pitch - 0.04
      }
      case 'smile': {
        const maxMouth = Math.max(...samples.map((s) => s.mouth))
        return maxMouth > baseline.mouth * 1.1
      }
      default:
        return false
    }
  }

  private async detectDescriptorWithRetry(attempts = 3): Promise<Float32Array | null> {
    if (!this.video) return null
    for (let i = 0; i < attempts; i++) {
      try {
        const result = await faceapi
          .detectSingleFace(this.video, detectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor()
        if (result) return result.descriptor
      } catch (err) {
        // A TF.js/WebGL failure here must not hang the caller forever —
        // fail this attempt closed (treated as "no face found") and retry.
        console.error('[RealFaceAuthProvider] detection failed', err)
      }
      await delay(120)
    }
    return null
  }

  private toFaceMetrics(result: {
    detection: faceapi.FaceDetection
    landmarks: faceapi.FaceLandmarks68
  }): FaceMetrics {
    const video = this.video!
    const box = result.detection.box
    const leftEye = result.landmarks.getLeftEye()
    const rightEye = result.landmarks.getRightEye()
    const nose = result.landmarks.getNose()
    const eyeDistance = Math.hypot(rightEye[0].x - leftEye[3].x, rightEye[0].y - leftEye[3].y)

    return {
      boundingBox: {
        x: box.x / video.videoWidth,
        y: box.y / video.videoHeight,
        width: box.width / video.videoWidth,
        height: box.height / video.videoHeight
      },
      eyeDistance,
      yaw: yawEstimate(leftEye, rightEye, nose) * 100,
      pitch: pitchEstimate(leftEye, rightEye, nose) * 100,
      roll: 0,
      livenessScore: clamp(0, 100, averageEyeAspectRatio(leftEye, rightEye) * 300),
      identityConfidence: this.lastIdentityConfidence
    }
  }
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value))
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/**
 * Pure euclidean-distance-to-confidence mapping — no camera, no async, just
 * comparing two already-captured descriptors. Callers loop this over every
 * descriptor in a user's enrollment gallery and take the best result,
 * rather than re-capturing the camera once per stored descriptor.
 *
 * Standard face-api.js accept boundary is ~0.6 euclidean distance; mapped
 * onto our 0-100 confidence scale with some headroom either side. Needs
 * real-world tuning per device/lighting — see README.
 */
export function matchConfidence(live: Float32Array, stored: Float32Array): number {
  const distance = faceapi.euclideanDistance(live, stored)
  return clamp(0, 100, (1 - distance / 1.2) * 100)
}

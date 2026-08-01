import * as faceapi from '@vladmandic/face-api'
import type { FaceAuthProvider } from './FaceAuthProvider'
import type { FaceMetrics, LivenessChallengeKind } from '../types/auth'
import { loadFaceModels } from './faceApiModels'
import { averageEyeAspectRatio, yawEstimate, pitchEstimate, mouthAspectRatio } from './faceGeometry'

const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.5
})

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
      const result = await faceapi
        .detectSingleFace(this.video, DETECTOR_OPTIONS)
        .withFaceLandmarks()
      if (!result) {
        this.metrics = null
        return
      }
      this.metrics = this.toFaceMetrics(result)
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

  async matchEmbedding(stored: Float32Array): Promise<{ confidence: number }> {
    const descriptor = await this.detectDescriptorWithRetry()
    if (!descriptor) {
      this.lastIdentityConfidence = 0
      return { confidence: 0 }
    }
    const distance = faceapi.euclideanDistance(descriptor, stored)
    // Standard face-api.js accept boundary is ~0.6 euclidean distance;
    // map that onto our 0-100 confidence scale with some headroom either
    // side. Needs real-world tuning per device/lighting — see README.
    const confidence = clamp(0, 100, (1 - distance / 1.2) * 100)
    this.lastIdentityConfidence = confidence
    return { confidence }
  }

  async evaluateLivenessChallenge(kind: LivenessChallengeKind): Promise<boolean> {
    if (!this.video) return false

    const samples: Array<{
      ear: number
      yaw: number
      pitch: number
      mouth: number
    }> = []

    const sampleWindowMs = 2200
    const sampleIntervalMs = 120
    const steps = Math.floor(sampleWindowMs / sampleIntervalMs)

    for (let i = 0; i < steps; i++) {
      const result = await faceapi
        .detectSingleFace(this.video, DETECTOR_OPTIONS)
        .withFaceLandmarks()
      if (result) {
        samples.push({
          ear: averageEyeAspectRatio(result.landmarks.getLeftEye(), result.landmarks.getRightEye()),
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
      await delay(sampleIntervalMs)
    }

    if (samples.length < steps * 0.4) return false // face wasn't tracked reliably enough to judge

    const baseline = samples[0]

    switch (kind) {
      case 'blink': {
        const minEar = Math.min(...samples.map((s) => s.ear))
        return minEar < baseline.ear * 0.72
      }
      case 'turnLeft': {
        const minYaw = Math.min(...samples.map((s) => s.yaw))
        return minYaw < baseline.yaw - 0.09
      }
      case 'turnRight': {
        const maxYaw = Math.max(...samples.map((s) => s.yaw))
        return maxYaw > baseline.yaw + 0.09
      }
      case 'lookUp': {
        const minPitch = Math.min(...samples.map((s) => s.pitch))
        return minPitch < baseline.pitch - 0.07
      }
      case 'smile': {
        const maxMouth = Math.max(...samples.map((s) => s.mouth))
        return maxMouth > baseline.mouth * 1.18
      }
      default:
        return false
    }
  }

  private async detectDescriptorWithRetry(attempts = 4): Promise<Float32Array | null> {
    if (!this.video) return null
    for (let i = 0; i < attempts; i++) {
      const result = await faceapi
        .detectSingleFace(this.video, DETECTOR_OPTIONS)
        .withFaceLandmarks()
        .withFaceDescriptor()
      if (result) return result.descriptor
      await delay(250)
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

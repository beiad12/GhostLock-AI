import type { Point } from '@vladmandic/face-api'

/**
 * Small geometric heuristics computed from real 68-point face landmarks —
 * genuine signals (not simulated), though the thresholds that consume them
 * are simple and will likely need real-world tuning per camera/lighting.
 */

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } as Point
}

/** Eye aspect ratio (EAR): drops sharply when the eye closes. Standard 6-point formula. */
export function eyeAspectRatio(eye: Point[]): number {
  const vertical1 = dist(eye[1], eye[5])
  const vertical2 = dist(eye[2], eye[4])
  const horizontal = dist(eye[0], eye[3])
  return horizontal === 0 ? 0 : (vertical1 + vertical2) / (2 * horizontal)
}

export function averageEyeAspectRatio(leftEye: Point[], rightEye: Point[]): number {
  return (eyeAspectRatio(leftEye) + eyeAspectRatio(rightEye)) / 2
}

/**
 * Signed horizontal offset of the nose tip from the eye-center midpoint,
 * normalized by inter-eye distance. Negative = turned toward the camera's
 * left, positive = toward the camera's right.
 */
export function yawEstimate(leftEye: Point[], rightEye: Point[], nose: Point[]): number {
  const leftCenter = midpoint(leftEye[0], leftEye[3])
  const rightCenter = midpoint(rightEye[0], rightEye[3])
  const eyeMid = midpoint(leftCenter, rightCenter)
  const eyeDistance = dist(leftCenter, rightCenter) || 1
  const noseTip = nose[Math.min(3, nose.length - 1)]
  return (noseTip.x - eyeMid.x) / eyeDistance
}

/**
 * Signed vertical offset of the nose bridge relative to the eye line,
 * normalized by inter-eye distance. Negative = tilted up.
 */
export function pitchEstimate(leftEye: Point[], rightEye: Point[], nose: Point[]): number {
  const leftCenter = midpoint(leftEye[0], leftEye[3])
  const rightCenter = midpoint(rightEye[0], rightEye[3])
  const eyeMid = midpoint(leftCenter, rightCenter)
  const eyeDistance = dist(leftCenter, rightCenter) || 1
  const noseBridge = nose[0]
  return (noseBridge.y - eyeMid.y) / eyeDistance
}

/** Mouth width-to-height ratio: widens on a smile. */
export function mouthAspectRatio(mouth: Point[]): number {
  const width = dist(mouth[0], mouth[6])
  const height = dist(mouth[3], mouth[9])
  return height === 0 ? 0 : width / height
}

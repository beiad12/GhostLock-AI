import * as faceapi from '@vladmandic/face-api'

const MODEL_URL = 'models'

let loadPromise: Promise<void> | null = null

/**
 * Loads the on-device face detection/landmark/recognition models exactly
 * once (idempotent, cached). All three model files ship inside the app
 * (see `src/renderer/public/models`) — nothing is ever fetched over the
 * network.
 */
export function loadFaceModels(): Promise<void> {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]).then(() => undefined)
  }
  return loadPromise
}

export function areFaceModelsLoaded(): boolean {
  return (
    faceapi.nets.tinyFaceDetector.isLoaded &&
    faceapi.nets.faceLandmark68Net.isLoaded &&
    faceapi.nets.faceRecognitionNet.isLoaded
  )
}

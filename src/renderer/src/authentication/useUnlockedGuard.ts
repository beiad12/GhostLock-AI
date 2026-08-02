import { useEffect } from 'react'
import { RealFaceAuthProvider, matchConfidence } from './RealFaceAuthProvider'
import { decodeEmbedding } from './vaultRepository'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { useFlowStore } from '../store/flowStore'

/**
 * Runs in the background while the desktop is unlocked, periodically
 * re-checking the camera against the enrolled face. If a face IS present
 * but doesn't match closely enough, it drops straight to the intruder-lock
 * screen and re-engages the kiosk lock. No face in frame at all (desk is
 * simply empty) does not trigger this — that's what the separate
 * inactivity timeout is for.
 */
export function useUnlockedGuard(active: boolean, intervalMs = 6000): void {
  const enrolledUsers = useAuthStore((s) => s.enrolledUsers)
  const cameraDeviceId = useSettingsStore((s) => s.settings.cameraDeviceId)
  const confidenceThreshold = useSettingsStore((s) => s.settings.confidenceThreshold)
  const goTo = useFlowStore((s) => s.goTo)

  useEffect(() => {
    if (!active || enrolledUsers.length === 0) return

    let cancelled = false
    let stream: MediaStream | null = null
    let intervalId: number | null = null
    const provider = new RealFaceAuthProvider()
    const videoEl = document.createElement('video')
    videoEl.muted = true
    videoEl.playsInline = true

    async function start(): Promise<void> {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: cameraDeviceId ? { deviceId: { exact: cameraDeviceId } } : { facingMode: 'user' },
          audio: false
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        videoEl.srcObject = stream
        await videoEl.play()
        await provider.startDetection(videoEl)
      } catch {
        // No camera available for the background guard — it simply won't run.
        return
      }

      // Require two consecutive low-confidence readings before locking.
      // Real-world confidence is noisy (a single bad angle/lighting frame
      // can dip below threshold even for the legitimate user) — a lone
      // miss isn't enough evidence to slam the desk lock on its owner.
      let consecutiveLowConfidence = 0
      intervalId = window.setInterval(async () => {
        if (cancelled) return
        // Skip cycles where no face is in frame at all — an empty desk
        // isn't an intruder, and matching against nothing always fails.
        if (!provider.getLatestMetrics()) return

        let confidence = 0
        try {
          const live = await provider.captureEmbedding()
          confidence = Math.max(
            0,
            ...enrolledUsers[0].embeddingsBase64.map((b64) =>
              matchConfidence(live, decodeEmbedding(b64))
            )
          )
        } catch {
          // Transient capture failure — skip this cycle rather than count
          // it as a mismatch.
          return
        }
        if (cancelled) return
        if (confidence < confidenceThreshold) {
          consecutiveLowConfidence += 1
          if (consecutiveLowConfidence >= 2) {
            if (intervalId !== null) window.clearInterval(intervalId)
            goTo('intruderLock')
          }
        } else {
          consecutiveLowConfidence = 0
        }
      }, intervalMs)
    }

    start()

    return () => {
      cancelled = true
      if (intervalId !== null) window.clearInterval(intervalId)
      provider.stopDetection()
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [active, enrolledUsers, cameraDeviceId, confidenceThreshold, intervalMs, goTo])
}

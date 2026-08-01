import { useEffect } from 'react'
import { MockFaceAuthProvider } from './MockFaceAuthProvider'
import { decodeEmbedding } from './vaultRepository'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { useFlowStore } from '../store/flowStore'

/**
 * Runs in the background while the desktop is unlocked, periodically
 * re-checking the camera against the enrolled face. On a mismatch it drops
 * straight to the intruder-lock screen and re-engages the kiosk lock.
 *
 * Milestone-1 caveat: `MockFaceAuthProvider.matchEmbedding` doesn't actually
 * compare faces yet (see its own doc comment), so this hook layers an
 * independent random "is this still you" roll on top purely to demo the
 * intruder-lock UX end to end. The real "someone else is using my PC"
 * signal has to come from the milestone 2 biometric engine.
 */
export function useUnlockedGuard(active: boolean, intervalMs = 8000): void {
  const enrolledUsers = useAuthStore((s) => s.enrolledUsers)
  const cameraDeviceId = useSettingsStore((s) => s.settings.cameraDeviceId)
  const goTo = useFlowStore((s) => s.goTo)

  useEffect(() => {
    if (!active || enrolledUsers.length === 0) return

    let cancelled = false
    let stream: MediaStream | null = null
    let intervalId: number | null = null
    const provider = new MockFaceAuthProvider()
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

      intervalId = window.setInterval(async () => {
        if (cancelled) return
        const stored = decodeEmbedding(enrolledUsers[0].embeddingBase64)
        const { confidence } = await provider.matchEmbedding(stored)
        const simulatedMismatch = Math.random() < 0.08
        if (cancelled) return
        if (simulatedMismatch || confidence < 40) {
          if (intervalId !== null) window.clearInterval(intervalId)
          goTo('intruderLock')
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
  }, [active, enrolledUsers, cameraDeviceId, intervalMs, goTo])
}

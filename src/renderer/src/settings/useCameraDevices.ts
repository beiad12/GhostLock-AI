import { useEffect, useState } from 'react'

export interface CameraDevice {
  deviceId: string
  label: string
}

/** Enumerates available video input devices for the camera selector. */
export function useCameraDevices(): CameraDevice[] {
  const [devices, setDevices] = useState<CameraDevice[]>([])

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        // Labels are only populated after permission has been granted once.
        await navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((s) => s.getTracks().forEach((t) => t.stop()))
        const all = await navigator.mediaDevices.enumerateDevices()
        if (cancelled) return
        setDevices(
          all
            .filter((d) => d.kind === 'videoinput')
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }))
        )
      } catch {
        if (!cancelled) setDevices([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return devices
}

import { useEffect, useRef, useState } from 'react'

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  ready: boolean
  error: string | null
}

/** Opens the selected (or default) webcam and attaches it to a video element. */
export function useCamera(deviceId: string | null): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    async function start(): Promise<void> {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
          audio: false
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Camera access denied')
      }
    }

    start()

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
      setReady(false)
    }
  }, [deviceId])

  return { videoRef, ready, error }
}

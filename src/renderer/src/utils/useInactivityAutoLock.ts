import { useEffect, useRef } from 'react'

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'wheel',
  'touchstart'
]

/**
 * Watches for user activity while `active` is true, and calls `onIdle` once
 * no mouse/keyboard/touch input has been seen for `idleMinutes`. Purely
 * real, local activity tracking — no camera or biometric involvement.
 */
export function useInactivityAutoLock(
  active: boolean,
  idleMinutes: number,
  onIdle: () => void
): void {
  const onIdleRef = useRef(onIdle)

  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  useEffect(() => {
    if (!active) return

    let timeoutId: number

    const resetTimer = (): void => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => onIdleRef.current(), idleMinutes * 60 * 1000)
    }

    resetTimer()
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true })
    }

    return () => {
      window.clearTimeout(timeoutId)
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [active, idleMinutes])
}

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useFlowStore } from '../../store/flowStore'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { sfx, speak } from '../../audio/soundEngine'

/**
 * Fired when the background guard (useUnlockedGuard) detects a probable
 * face mismatch while the desktop was unlocked. Re-engages the kiosk lock
 * and drops back to the scan screen after the alert plays out.
 */
export function IntruderLockScreen(): React.JSX.Element {
  const goTo = useFlowStore((s) => s.goTo)
  const recordAttempt = useAuthStore((s) => s.recordAttempt)
  const voiceEnabled = useSettingsStore((s) => s.settings.voiceEnabled)
  const soundsEnabled = useSettingsStore((s) => s.settings.soundsEnabled)

  useEffect(() => {
    if (soundsEnabled) {
      sfx.alarm()
      window.setTimeout(() => sfx.alarm(), 500)
    }
    speak('Unidentified user detected. Locking system.', voiceEnabled)
    void recordAttempt({
      success: false,
      userName: null,
      confidence: 0,
      reason: 'Unidentified user detected while unlocked'
    })
    void window.api.window.lockDesktop()

    const timeout = window.setTimeout(() => goTo('scan'), 4200)
    return () => window.clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--gl-background)] flex items-center justify-center">
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.2, 0.45, 0.15, 0.4, 0.2] }}
        transition={{ duration: 0.4, repeat: 6 }}
        style={{
          background: 'radial-gradient(circle at center, var(--gl-danger), transparent 65%)'
        }}
      />

      <GlitchFrame>
        <div
          className="relative z-10 gl-glass rounded-2xl px-16 py-12 text-center"
          style={{ boxShadow: '0 0 80px rgba(255,59,92,0.35)', borderColor: 'var(--gl-danger)' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            className="mx-auto mb-6 h-20 w-20 rounded-full flex items-center justify-center"
            style={{ border: '2px solid var(--gl-danger)' }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z"
                stroke="var(--gl-danger)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          <div
            className="gl-mono text-2xl font-bold tracking-widest gl-animate-flicker"
            style={{ color: 'var(--gl-danger)' }}
          >
            UNIDENTIFIED USER DETECTED
          </div>
          <div
            className="gl-mono text-3xl font-bold tracking-[0.2em] mt-2"
            style={{ color: 'var(--gl-danger)' }}
          >
            SYSTEM LOCKED
          </div>
          <div className="gl-mono text-sm mt-4" style={{ color: 'var(--gl-text-secondary)' }}>
            Re-scanning for authorized identity...
          </div>
        </div>
      </GlitchFrame>
    </div>
  )
}

function GlitchFrame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <motion.div
      initial={{ x: 0 }}
      animate={{ x: [0, -8, 7, -5, 8, -3, 0] }}
      transition={{ duration: 0.5, repeat: 5, repeatDelay: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

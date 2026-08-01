import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useFlowStore } from '../../store/flowStore'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { sfx, speak } from '../../audio/soundEngine'

export function AccessDeniedScreen(): React.JSX.Element {
  const goTo = useFlowStore((s) => s.goTo)
  const confidence = useFlowStore((s) => s.lastConfidence)
  const denialReason = useFlowStore((s) => s.lastDenialReason)
  const failedAttemptStreak = useAuthStore((s) => s.failedAttemptStreak)
  const maxFailedAttempts = useSettingsStore((s) => s.settings.maxFailedAttempts)
  const voiceEnabled = useSettingsStore((s) => s.settings.voiceEnabled)
  const soundsEnabled = useSettingsStore((s) => s.settings.soundsEnabled)

  const lockedOut = failedAttemptStreak >= maxFailedAttempts
  const intruderCaptured = lockedOut

  useEffect(() => {
    speak('Unknown user. Access denied.', voiceEnabled)
    if (soundsEnabled) sfx.alarm()

    const timeout = window.setTimeout(() => goTo('scan'), lockedOut ? 3800 : 2000)
    return () => window.clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--gl-background)] flex items-center justify-center">
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.15, 0.35, 0.1, 0.3, 0.15] }}
        transition={{ duration: 0.5, repeat: 4 }}
        style={{
          background: 'radial-gradient(circle at center, var(--gl-danger), transparent 65%)'
        }}
      />

      <GlitchFrame>
        <div
          className="relative z-10 gl-glass rounded-2xl px-16 py-12 text-center"
          style={{ boxShadow: '0 0 60px rgba(255,59,92,0.25)', borderColor: 'var(--gl-danger)' }}
        >
          <div
            className="mx-auto mb-6 h-20 w-20 rounded-full flex items-center justify-center"
            style={{ border: '2px solid var(--gl-danger)' }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="var(--gl-danger)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            className="gl-mono text-2xl font-bold tracking-widest"
            style={{ color: 'var(--gl-danger)' }}
          >
            UNKNOWN USER
          </div>
          <div
            className="gl-mono text-3xl font-bold tracking-[0.2em] mt-2"
            style={{ color: 'var(--gl-danger)' }}
          >
            ACCESS DENIED
          </div>
          <div className="gl-mono text-sm mt-3" style={{ color: 'var(--gl-text-secondary)' }}>
            Confidence {confidence.toFixed(1)}% — attempt {failedAttemptStreak} of{' '}
            {maxFailedAttempts}
          </div>
          {denialReason && (
            <div
              className="gl-mono text-xs mt-2 max-w-xs mx-auto"
              style={{ color: 'var(--gl-text-muted)' }}
            >
              {denialReason}
            </div>
          )}

          {intruderCaptured && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="gl-mono text-xs mt-4 uppercase tracking-widest"
              style={{ color: 'var(--gl-warning)' }}
            >
              Intruder mode: attempt logged with timestamp and confidence score
            </motion.div>
          )}
        </div>
      </GlitchFrame>
    </div>
  )
}

function GlitchFrame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <motion.div
      initial={{ x: 0 }}
      animate={{ x: [0, -6, 5, -3, 0] }}
      transition={{ duration: 0.4, repeat: 3, repeatDelay: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

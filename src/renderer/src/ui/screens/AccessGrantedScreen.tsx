import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ParticleField } from '../../animations/ParticleField'
import { useFlowStore } from '../../store/flowStore'
import { useSettingsStore } from '../../store/settingsStore'
import { speak } from '../../audio/soundEngine'

export function AccessGrantedScreen(): React.JSX.Element {
  const goTo = useFlowStore((s) => s.goTo)
  const userName = useFlowStore((s) => s.lastAuthenticatedUser)
  const confidence = useFlowStore((s) => s.lastConfidence)
  const voiceEnabled = useSettingsStore((s) => s.settings.voiceEnabled)

  useEffect(() => {
    speak(`Identity confirmed. Welcome back, ${userName ?? 'operator'}.`, voiceEnabled)
    void window.api.window.unlockDesktop()
    const timeout = window.setTimeout(() => goTo('unlocked'), 2600)
    return () => window.clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--gl-background)] flex items-center justify-center">
      <ParticleField density={45} className="absolute inset-0" />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0.15] }}
        transition={{ duration: 1.2 }}
        style={{
          background: 'radial-gradient(circle at center, var(--gl-accent-soft), transparent 65%)'
        }}
      />

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 14 }}
        className="relative z-10 gl-glass rounded-2xl px-16 py-12 text-center"
        style={{ boxShadow: '0 0 60px var(--gl-accent-soft)' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring' }}
          className="mx-auto mb-6 h-20 w-20 rounded-full flex items-center justify-center gl-animate-pulse-glow"
          style={{ border: '2px solid var(--gl-success)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5 10 17.5 19 7"
              stroke="var(--gl-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        <div
          className="gl-mono text-3xl font-bold tracking-[0.2em] gl-glow-text"
          style={{ color: 'var(--gl-success)' }}
        >
          ACCESS GRANTED
        </div>
        <div className="gl-mono text-lg mt-3" style={{ color: 'var(--gl-text-primary)' }}>
          {userName ?? 'Operator'}
        </div>
        <div className="gl-mono text-sm mt-1" style={{ color: 'var(--gl-text-secondary)' }}>
          Confidence {confidence.toFixed(1)}%
        </div>
      </motion.div>
    </div>
  )
}

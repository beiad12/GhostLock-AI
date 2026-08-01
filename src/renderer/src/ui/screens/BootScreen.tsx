import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TypingText } from '../components/TypingText'
import { ParticleField } from '../../animations/ParticleField'
import { HexOverlay } from '../../animations/HexOverlay'
import { sfx } from '../../audio/soundEngine'
import { useSettingsStore } from '../../store/settingsStore'

const BOOT_LINES = [
  'Initializing GhostLock AI...',
  'Loading Neural Engine...',
  'Initializing Security Core...',
  'Connecting Camera...',
  'Loading Face Database...',
  'Checking Encryption...',
  'Loading AI Models...',
  'Camera Online'
]

interface BootScreenProps {
  onComplete: () => void
}

export function BootScreen({ onComplete }: BootScreenProps): React.JSX.Element {
  const [lineIndex, setLineIndex] = useState(0)
  const soundsEnabled = useSettingsStore((s) => s.settings.soundsEnabled)

  useEffect(() => {
    if (soundsEnabled) sfx.boot()
  }, [soundsEnabled])

  useEffect(() => {
    if (lineIndex >= BOOT_LINES.length) {
      const timeout = window.setTimeout(onComplete, 700)
      return () => window.clearTimeout(timeout)
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIndex])

  const progress = Math.min(100, (lineIndex / BOOT_LINES.length) * 100)

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--gl-background)] flex items-center justify-center">
      <HexOverlay className="absolute inset-0 opacity-40" />
      <ParticleField density={35} className="absolute inset-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-[560px] max-w-[90vw]"
      >
        <div className="gl-glass rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="h-3 w-3 rounded-full gl-animate-pulse-glow"
              style={{ background: 'var(--gl-accent)' }}
            />
            <h1
              className="gl-mono text-xl tracking-[0.3em] uppercase"
              style={{ color: 'var(--gl-accent)' }}
            >
              GhostLock AI
            </h1>
          </div>

          <div
            className="gl-mono text-sm space-y-2 min-h-[220px]"
            style={{ color: 'var(--gl-text-secondary)' }}
          >
            {BOOT_LINES.slice(0, lineIndex + 1).map((line, idx) => (
              <div key={line} className="flex items-center gap-2">
                <span style={{ color: 'var(--gl-accent)' }}>{'>'}</span>
                {idx === lineIndex ? (
                  <TypingText
                    text={line}
                    speedMs={16}
                    onComplete={() => setLineIndex((i) => i + 1)}
                  />
                ) : (
                  <span>{line}</span>
                )}
                {idx < lineIndex && <span style={{ color: 'var(--gl-success)' }}>OK</span>}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-black/40">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--gl-accent)' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>
            <div
              className="gl-mono text-xs mt-2 text-right"
              style={{ color: 'var(--gl-text-muted)' }}
            >
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

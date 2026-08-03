import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCamera } from '../../camera/useCamera'
import { ParticleField } from '../../animations/ParticleField'
import { HexOverlay } from '../../animations/HexOverlay'
import { GlassPanel } from '../components/GlassPanel'
import { RealFaceAuthProvider } from '../../authentication/RealFaceAuthProvider'
import type { FaceAuthProvider } from '../../authentication/FaceAuthProvider'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useFlowStore } from '../../store/flowStore'
import { sfx } from '../../audio/soundEngine'

type EnrollStep =
  'name' | 'left' | 'right' | 'up' | 'down' | 'smile' | 'blink' | 'processing' | 'done'

const CAPTURE_STEPS: { step: EnrollStep; label: string }[] = [
  { step: 'left', label: 'Turn your head slightly left' },
  { step: 'right', label: 'Turn your head slightly right' },
  { step: 'up', label: 'Tilt your head upward' },
  { step: 'down', label: 'Tilt your head downward' },
  { step: 'smile', label: 'Give a natural smile' },
  { step: 'blink', label: 'Blink naturally' }
]

// Each angle is no longer a single snapshot — it's a short burst of frames
// while you hold the pose, so the stored gallery covers dozens of slightly
// different instants of your face (micro-movement, blinks, lighting) per
// angle instead of one frame each. This is what actually improves
// recognition: more, varied real samples of your face beat one "perfect"
// shot per pose.
const BURST_DURATION_MS = 1800
const BURST_INTERVAL_MS = 150
const MIN_FRAMES_PER_ANGLE = 3

export function EnrollScreen(): React.JSX.Element {
  const cameraDeviceId = useSettingsStore((s) => s.settings.cameraDeviceId)
  const soundsEnabled = useSettingsStore((s) => s.settings.soundsEnabled)
  const { videoRef, ready, error } = useCamera(cameraDeviceId)
  const enrollUser = useAuthStore((s) => s.enrollUser)
  const goTo = useFlowStore((s) => s.goTo)

  const providerRef = useRef<FaceAuthProvider | null>(null)
  const [step, setStep] = useState<EnrollStep>('name')
  const [name, setName] = useState('')
  const [captureIndex, setCaptureIndex] = useState(0)
  const [capturedAngles, setCapturedAngles] = useState<string[]>([])
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [burstProgress, setBurstProgress] = useState({ done: 0, total: 0 })
  // Every valid frame from every angle's burst lands here as its own
  // gallery descriptor — not averaged, not deduplicated. More real samples
  // of the face (across pose, blink, and lighting micro-variation) is what
  // makes live matching more robust, not one "best" shot per pose.
  const descriptorsRef = useRef<Float32Array[]>([])

  useEffect(() => {
    if (!providerRef.current) providerRef.current = new RealFaceAuthProvider()
    return () => {
      providerRef.current?.stopDetection()
    }
  }, [])

  useEffect(() => {
    if (ready && videoRef.current) {
      providerRef.current?.startDetection(videoRef.current)
    }
  }, [ready, videoRef])

  async function captureNextAngle(): Promise<void> {
    const current = CAPTURE_STEPS[captureIndex]
    if (soundsEnabled) sfx.click()
    setEnrollError(null)
    const provider = providerRef.current!

    setIsCapturing(true)
    setBurstProgress({ done: 0, total: 0 })
    const frames = await provider.captureEmbeddingBurst(
      BURST_DURATION_MS,
      BURST_INTERVAL_MS,
      (done, total) => setBurstProgress({ done, total })
    )
    setIsCapturing(false)

    if (frames.length < MIN_FRAMES_PER_ANGLE) {
      setEnrollError(
        `Only caught ${frames.length} clear frame${frames.length === 1 ? '' : 's'} — hold the pose steady in good lighting and try this angle again.`
      )
      return
    }

    descriptorsRef.current.push(...frames)
    setCapturedAngles((prev) => [...prev, current.step])

    if (captureIndex + 1 < CAPTURE_STEPS.length) {
      setCaptureIndex((i) => i + 1)
      setStep(CAPTURE_STEPS[captureIndex + 1].step)
    } else {
      setStep('processing')
      try {
        // Store every captured frame's descriptor separately rather than
        // averaging them — averaging different head poses/instants
        // together dilutes the representation and pulls it away from what
        // a normal frontal live scan looks like. Matching instead compares
        // against every stored descriptor and keeps the best result.
        await enrollUser(name.trim() || 'Operator', descriptorsRef.current)
        setStep('done')
        if (soundsEnabled) sfx.accessGranted()
        await delay(1200)
        goTo('scan')
      } catch (err) {
        descriptorsRef.current = []
        setCapturedAngles([])
        setCaptureIndex(0)
        setEnrollError(err instanceof Error ? err.message : 'Enrollment failed')
        setStep(CAPTURE_STEPS[0].step)
      }
    }
  }

  const currentStepMeta = CAPTURE_STEPS[captureIndex]

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--gl-background)] flex items-center justify-center">
      <HexOverlay className="absolute inset-0 opacity-30" />
      <ParticleField density={35} className="absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className="gl-mono text-xs uppercase tracking-[0.4em]"
          style={{ color: 'var(--gl-accent)' }}
        >
          Identity Enrollment
        </div>

        <div
          className="relative w-[360px] h-[360px] rounded-xl overflow-hidden border-2"
          style={{ borderColor: 'var(--gl-glass-border)' }}
        >
          {error ? (
            <div
              className="h-full w-full flex items-center justify-center gl-mono text-sm p-4 text-center"
              style={{ color: 'var(--gl-danger)' }}
            >
              {error}
            </div>
          ) : (
            <video
              ref={videoRef}
              className="h-full w-full object-cover scale-x-[-1]"
              muted
              playsInline
            />
          )}
        </div>

        <GlassPanel className="w-[420px] p-6">
          <AnimatePresence mode="wait">
            {step === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="gl-mono text-sm mb-3" style={{ color: 'var(--gl-text-secondary)' }}>
                  Enter your identity name
                </div>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Carter"
                  className="w-full bg-black/40 border rounded-lg px-4 py-2 gl-mono text-sm outline-none"
                  style={{ borderColor: 'var(--gl-glass-border)', color: 'var(--gl-text-primary)' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      setStep(CAPTURE_STEPS[0].step)
                    }
                  }}
                />
                <button
                  disabled={!name.trim()}
                  onClick={() => setStep(CAPTURE_STEPS[0].step)}
                  className="mt-4 w-full rounded-lg py-2 gl-mono text-sm uppercase tracking-widest disabled:opacity-30"
                  style={{
                    background: 'var(--gl-accent-soft)',
                    color: 'var(--gl-accent)',
                    border: '1px solid var(--gl-glass-border)'
                  }}
                >
                  Begin Capture
                </button>
              </motion.div>
            )}

            {currentStepMeta && step === currentStepMeta.step && (
              <motion.div
                key={step}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="gl-mono text-xs mb-2" style={{ color: 'var(--gl-text-muted)' }}>
                  Step {captureIndex + 1} of {CAPTURE_STEPS.length}
                </div>
                <div className="gl-mono text-lg mb-4" style={{ color: 'var(--gl-accent)' }}>
                  {currentStepMeta.label}
                </div>
                {enrollError && (
                  <div className="gl-mono text-xs mb-3" style={{ color: 'var(--gl-danger)' }}>
                    {enrollError}
                  </div>
                )}
                <button
                  onClick={captureNextAngle}
                  disabled={isCapturing}
                  className="w-full rounded-lg py-2 gl-mono text-sm uppercase tracking-widest disabled:opacity-60"
                  style={{
                    background: 'var(--gl-accent-soft)',
                    color: 'var(--gl-accent)',
                    border: '1px solid var(--gl-glass-border)'
                  }}
                >
                  {isCapturing
                    ? `Hold still — capturing ${burstProgress.done}/${burstProgress.total}`
                    : 'Start Capture'}
                </button>
                {isCapturing && (
                  <div
                    className="h-1 w-full rounded-full mt-2 overflow-hidden"
                    style={{ background: 'var(--gl-glass-border)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-150"
                      style={{
                        background: 'var(--gl-accent)',
                        width: `${burstProgress.total ? (burstProgress.done / burstProgress.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                )}
                <div className="flex gap-1 mt-4">
                  {CAPTURE_STEPS.map((s) => (
                    <div
                      key={s.step}
                      className="h-1 flex-1 rounded-full"
                      style={{
                        background: capturedAngles.includes(s.step)
                          ? 'var(--gl-accent)'
                          : 'var(--gl-glass-border)'
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center gl-mono text-sm"
                style={{ color: 'var(--gl-text-secondary)' }}
              >
                Generating encrypted embedding...
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center gl-mono text-sm"
                style={{ color: 'var(--gl-success)' }}
              >
                Profile secured. Welcome, {name.trim() || 'Operator'}.
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </div>
    </div>
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCamera } from '../../camera/useCamera'
import { ParticleField } from '../../animations/ParticleField'
import { BinaryRain } from '../../animations/BinaryRain'
import { RadarSweep } from '../../animations/RadarSweep'
import { HexOverlay } from '../../animations/HexOverlay'
import { ScanLaser } from '../../animations/ScanLaser'
import { ConfidenceGauge } from '../components/ConfidenceGauge'
import { RealFaceAuthProvider } from '../../authentication/RealFaceAuthProvider'
import type { FaceAuthProvider } from '../../authentication/FaceAuthProvider'
import type { FaceMetrics, ScanPhase } from '../../types/auth'
import { generateChallengeSequence } from '../../liveness/challenges'
import { decodeEmbedding } from '../../authentication/vaultRepository'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useFlowStore } from '../../store/flowStore'
import { sfx } from '../../audio/soundEngine'

const PHASE_LABEL: Record<ScanPhase, string> = {
  idle: 'STANDBY',
  detecting: 'ACQUIRING TARGET LOCK',
  analyzing: 'ANALYZING FACIAL GEOMETRY',
  liveness: 'LIVENESS VERIFICATION',
  matching: 'MATCHING IDENTITY',
  granted: 'ACCESS GRANTED',
  denied: 'ACCESS DENIED'
}

export function FaceScanScreen(): React.JSX.Element {
  const cameraDeviceId = useSettingsStore((s) => s.settings.cameraDeviceId)
  const confidenceThreshold = useSettingsStore((s) => s.settings.confidenceThreshold)
  const soundsEnabled = useSettingsStore((s) => s.settings.soundsEnabled)
  const { videoRef, ready, error } = useCamera(cameraDeviceId)

  const enrolledUsers = useAuthStore((s) => s.enrolledUsers)
  const recordAttempt = useAuthStore((s) => s.recordAttempt)
  const goTo = useFlowStore((s) => s.goTo)
  const setAuthResult = useFlowStore((s) => s.setAuthResult)

  const providerRef = useRef<FaceAuthProvider | null>(null)
  const [phase, setPhase] = useState<ScanPhase>('idle')
  const [metrics, setMetrics] = useState<FaceMetrics | null>(null)
  const [challengeLabel, setChallengeLabel] = useState<string | null>(null)
  const runStartedRef = useRef(false)

  useEffect(() => {
    if (!providerRef.current) providerRef.current = new RealFaceAuthProvider()
    return () => {
      providerRef.current?.stopDetection()
    }
  }, [])

  useEffect(() => {
    if (!ready || !videoRef.current || runStartedRef.current) return
    runStartedRef.current = true
    const provider = providerRef.current!
    let cancelled = false

    async function run(): Promise<void> {
      setPhase('detecting')
      await provider.startDetection(videoRef.current!)

      // Poll metrics until a face is confidently detected.
      await new Promise<void>((resolve) => {
        const poll = window.setInterval(() => {
          const m = provider.getLatestMetrics()
          if (m) {
            setMetrics(m)
            window.clearInterval(poll)
            resolve()
          }
        }, 100)
      })
      if (cancelled) return
      if (soundsEnabled) sfx.radarPing()

      const metricsInterval = window.setInterval(() => {
        setMetrics(provider.getLatestMetrics())
      }, 250)

      setPhase('analyzing')
      await delay(1400)
      if (cancelled) return

      setPhase('liveness')
      const challenges = generateChallengeSequence(2)
      let livenessOk = true
      for (const challenge of challenges) {
        setChallengeLabel(challenge.label)
        const ok = await provider.evaluateLivenessChallenge(challenge.kind)
        if (!ok) {
          livenessOk = false
          break
        }
      }
      setChallengeLabel(null)
      if (cancelled) return

      if (!livenessOk) {
        window.clearInterval(metricsInterval)
        if (soundsEnabled) sfx.accessDenied()
        await recordAttempt({
          success: false,
          userName: null,
          confidence: 0,
          reason: 'Liveness check failed'
        })
        setAuthResult(null, 0)
        setPhase('denied')
        goTo('denied')
        return
      }

      setPhase('matching')
      let bestName: string | null = null
      let bestConfidence = 0
      if (enrolledUsers.length === 0) {
        bestConfidence = 0
      } else {
        for (const user of enrolledUsers) {
          const stored = decodeEmbedding(user.embeddingBase64)
          const { confidence } = await provider.matchEmbedding(stored)
          if (confidence > bestConfidence) {
            bestConfidence = confidence
            bestName = user.name
          }
        }
      }
      window.clearInterval(metricsInterval)
      if (cancelled) return

      const success = bestConfidence >= confidenceThreshold && bestName !== null
      await recordAttempt({
        success,
        userName: success ? bestName : null,
        confidence: bestConfidence,
        reason: success ? undefined : 'Confidence below threshold'
      })
      setAuthResult(success ? bestName : null, bestConfidence)

      if (success) {
        if (soundsEnabled) sfx.accessGranted()
        setPhase('granted')
        goTo('granted')
      } else {
        if (soundsEnabled) sfx.accessDenied()
        setPhase('denied')
        goTo('denied')
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--gl-background)]">
      <HexOverlay className="absolute inset-0 opacity-30" />
      <ParticleField density={40} className="absolute inset-0" />
      <BinaryRain columns={16} className="absolute inset-0" />

      <div className="relative z-10 h-full w-full flex items-center justify-center gap-10 px-10">
        {/* Left metrics panel */}
        <div className="w-72 gl-glass rounded-xl p-5 hidden lg:block">
          <div
            className="gl-mono text-xs uppercase tracking-widest mb-4"
            style={{ color: 'var(--gl-accent)' }}
          >
            Biometric Telemetry
          </div>
          <div className="space-y-3">
            <ConfidenceGauge
              label="Eye Distance (px)"
              value={metrics ? metrics.eyeDistance : 0}
              suffix=""
            />
            <ConfidenceGauge label="Liveness Score" value={metrics ? metrics.livenessScore : 0} />
            <ConfidenceGauge
              label="Identity Confidence"
              value={metrics ? metrics.identityConfidence : 0}
            />
          </div>
          <div className="mt-4 gl-mono text-xs space-y-1" style={{ color: 'var(--gl-text-muted)' }}>
            <div>YAW {metrics ? metrics.yaw.toFixed(1) : '0.0'}°</div>
            <div>PITCH {metrics ? metrics.pitch.toFixed(1) : '0.0'}°</div>
            <div>ROLL {metrics ? metrics.roll.toFixed(1) : '0.0'}°</div>
          </div>
        </div>

        {/* Center scan frame */}
        <div className="relative w-[560px] max-w-full aspect-square flex items-center justify-center">
          <RadarSweep size={620} className="absolute" />
          <div
            className="relative w-[420px] h-[420px] rounded-xl overflow-hidden border-2"
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
            <ScanLaser active={phase === 'detecting' || phase === 'analyzing'} />

            {/* Corner brackets */}
            {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
              <CornerBracket key={corner} corner={corner} />
            ))}

            {/* Bounding box */}
            {metrics && (
              <div
                className="absolute border-2 rounded-md transition-all duration-150"
                style={{
                  borderColor: 'var(--gl-accent)',
                  left: `${metrics.boundingBox.x * 100}%`,
                  top: `${metrics.boundingBox.y * 100}%`,
                  width: `${metrics.boundingBox.width * 100}%`,
                  height: `${metrics.boundingBox.height * 100}%`,
                  boxShadow: '0 0 18px var(--gl-accent-soft)'
                }}
              />
            )}
          </div>

          <AnimatePresence>
            {challengeLabel && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-4 gl-glass rounded-full px-5 py-2 gl-mono text-sm uppercase tracking-wide"
                style={{ color: 'var(--gl-accent-strong)' }}
              >
                {challengeLabel}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right status panel */}
        <div className="w-72 gl-glass rounded-xl p-5 hidden lg:block">
          <div
            className="gl-mono text-xs uppercase tracking-widest mb-4"
            style={{ color: 'var(--gl-accent)' }}
          >
            System Status
          </div>
          <div className="gl-mono text-sm mb-4 gl-glow-text" style={{ color: 'var(--gl-accent)' }}>
            {PHASE_LABEL[phase]}
          </div>
          <div className="gl-mono text-xs space-y-2" style={{ color: 'var(--gl-text-muted)' }}>
            <div>Enrolled Face: {enrolledUsers.length > 0 ? 'YES' : 'NONE'}</div>
            <div>Threshold: {confidenceThreshold}%</div>
            <div>Encryption: AES-256 ACTIVE</div>
            <div>Network: OFFLINE (BY DESIGN)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CornerBracket({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }): React.JSX.Element {
  const pos: Record<string, string> = {
    tl: 'top-0 left-0 border-t-2 border-l-2',
    tr: 'top-0 right-0 border-t-2 border-r-2',
    bl: 'bottom-0 left-0 border-b-2 border-l-2',
    br: 'bottom-0 right-0 border-b-2 border-r-2'
  }
  return (
    <div
      className={`absolute h-8 w-8 ${pos[corner]}`}
      style={{ borderColor: 'var(--gl-accent)' }}
    />
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

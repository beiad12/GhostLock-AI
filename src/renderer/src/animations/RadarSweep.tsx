interface RadarSweepProps {
  size?: number
  className?: string
}

/** Rotating radar sweep with concentric range rings, for HUD framing. */
export function RadarSweep({ size = 480, className }: RadarSweepProps): React.JSX.Element {
  return (
    <div
      className={className}
      style={{ width: size, height: size, position: 'relative' }}
      aria-hidden="true"
    >
      {[1, 0.72, 0.44].map((scale) => (
        <div
          key={scale}
          className="absolute rounded-full"
          style={{
            inset: `${(1 - scale) * 50}%`,
            border: '1px solid var(--gl-glass-border)'
          }}
        />
      ))}
      <div
        className="absolute inset-0 rounded-full gl-animate-spin-slow"
        style={{
          background:
            'conic-gradient(from 0deg, var(--gl-accent-soft) 0deg, transparent 60deg, transparent 360deg)'
        }}
      />
      <div
        className="absolute rounded-full gl-animate-spin-reverse"
        style={{ inset: '10%', border: '1px dashed var(--gl-glass-border)' }}
      />
    </div>
  )
}

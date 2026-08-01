interface ConfidenceGaugeProps {
  label: string
  value: number
  suffix?: string
}

export function ConfidenceGauge({
  label,
  value,
  suffix = '%'
}: ConfidenceGaugeProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="gl-mono text-xs" style={{ color: 'var(--gl-text-secondary)' }}>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span style={{ color: 'var(--gl-accent)' }}>
          {clamped.toFixed(1)}
          {suffix}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-black/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-200 ease-out"
          style={{ width: `${clamped}%`, background: 'var(--gl-accent)' }}
        />
      </div>
    </div>
  )
}

interface SliderFieldProps {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  suffix?: string
}

export function SliderField({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
  suffix = '%'
}: SliderFieldProps): React.JSX.Element {
  return (
    <div className="py-2">
      <div
        className="flex justify-between mb-1 gl-mono text-sm"
        style={{ color: 'var(--gl-text-secondary)' }}
      >
        <span>{label}</span>
        <span style={{ color: 'var(--gl-accent)' }}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--gl-accent)]"
      />
    </div>
  )
}

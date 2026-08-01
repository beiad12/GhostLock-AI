interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Toggle({ checked, onChange, label }: ToggleProps): React.JSX.Element {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-2"
      type="button"
    >
      <span className="gl-mono text-sm" style={{ color: 'var(--gl-text-secondary)' }}>
        {label}
      </span>
      <span
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ background: checked ? 'var(--gl-accent)' : 'var(--gl-glass-border)' }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-black/70 transition-transform"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </span>
    </button>
  )
}

interface StatCardProps {
  label: string
  value: string
  percent?: number
}

export function StatCard({ label, value, percent }: StatCardProps): React.JSX.Element {
  return (
    <div className="gl-glass rounded-lg p-4">
      <div
        className="gl-mono text-xs uppercase tracking-widest mb-1"
        style={{ color: 'var(--gl-text-muted)' }}
      >
        {label}
      </div>
      <div className="gl-mono text-2xl mb-2" style={{ color: 'var(--gl-accent)' }}>
        {value}
      </div>
      {percent !== undefined && (
        <div className="h-1 w-full rounded-full bg-black/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.min(100, percent)}%`, background: 'var(--gl-accent)' }}
          />
        </div>
      )}
    </div>
  )
}

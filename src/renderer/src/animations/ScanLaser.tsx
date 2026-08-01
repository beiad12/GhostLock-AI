/** Vertical scanning laser sweeping top-to-bottom across its container. */
export function ScanLaser({ active = true }: { active?: boolean }): React.JSX.Element {
  if (!active) return <></>
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
      <div
        className="absolute left-0 right-0 h-16 gl-animate-scanline"
        style={{
          background:
            'linear-gradient(to bottom, transparent, var(--gl-accent-soft) 45%, var(--gl-accent) 50%, var(--gl-accent-soft) 55%, transparent)',
          opacity: 0.7
        }}
      />
    </div>
  )
}

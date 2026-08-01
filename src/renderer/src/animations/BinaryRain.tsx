import { useState } from 'react'

interface BinaryRainProps {
  columns?: number
  className?: string
}

/** Faint floating binary digit columns drifting upward, purely decorative HUD chrome. */
export function BinaryRain({ columns = 18, className }: BinaryRainProps): React.JSX.Element {
  // Lazy initializer: randomized once per mount, never recomputed during render.
  const [streams] = useState(() =>
    Array.from({ length: columns }, (_, i) => ({
      id: i,
      left: (i / columns) * 100 + (Math.random() * 4 - 2),
      duration: 6 + Math.random() * 10,
      delay: -Math.random() * 12,
      text: Array.from({ length: 24 }, () => (Math.random() > 0.5 ? '1' : '0')).join('')
    }))
  )

  return (
    <div className={className} aria-hidden="true">
      {streams.map((s) => (
        <div
          key={s.id}
          className="gl-mono absolute top-0 text-[11px] leading-4 opacity-0"
          style={{
            left: `${s.left}%`,
            color: 'var(--gl-accent)',
            animation: `gl-binary-fall ${s.duration}s linear infinite`,
            animationDelay: `${s.delay}s`
          }}
        >
          {s.text.split('').map((digit, idx) => (
            <div key={idx} style={{ opacity: 1 - idx / s.text.length }}>
              {digit}
            </div>
          ))}
        </div>
      ))}
      <style>{`
        @keyframes gl-binary-fall {
          0% { transform: translateY(-20%); opacity: 0; }
          10% { opacity: 0.35; }
          90% { opacity: 0.35; }
          100% { transform: translateY(120%); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

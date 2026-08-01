/** Faint hexagonal HUD tiling used as an ambient backdrop layer. */
export function HexOverlay({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} aria-hidden="true" width="100%" height="100%">
      <defs>
        <pattern
          id="gl-hex"
          width="56"
          height="97"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(1)"
        >
          <polygon
            points="28,0 56,16 56,48 28,64 0,48 0,16"
            fill="none"
            stroke="var(--gl-glass-border)"
            strokeWidth="1"
          />
          <polygon
            points="28,48 56,64 56,96 28,112 0,96 0,64"
            fill="none"
            stroke="var(--gl-glass-border)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gl-hex)" opacity={0.35} />
    </svg>
  )
}

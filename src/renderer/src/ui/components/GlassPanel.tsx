import type { PropsWithChildren } from 'react'
import clsx from 'clsx'

interface GlassPanelProps {
  className?: string
  glow?: boolean
}

export function GlassPanel({
  children,
  className,
  glow = false
}: PropsWithChildren<GlassPanelProps>): React.JSX.Element {
  return (
    <div
      className={clsx(
        'gl-glass rounded-xl',
        glow && 'shadow-[0_0_30px_var(--gl-accent-soft)]',
        className
      )}
    >
      {children}
    </div>
  )
}

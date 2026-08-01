import { useEffect, useState } from 'react'

interface TypingTextProps {
  text: string
  speedMs?: number
  onComplete?: () => void
  className?: string
  cursor?: boolean
}

/**
 * Renders `text` with a terminal-style character-by-character typing animation.
 * Mount a fresh instance (e.g. via `key={text}`) for each new string — the
 * typed progress is only ever counted up, never reset, from a given mount.
 */
export function TypingText({
  text,
  speedMs = 18,
  onComplete,
  className,
  cursor = true
}: TypingTextProps): React.JSX.Element {
  const [visibleChars, setVisibleChars] = useState(0)

  useEffect(() => {
    if (text.length === 0) {
      onComplete?.()
      return
    }
    const interval = window.setInterval(() => {
      setVisibleChars((prev) => {
        const next = prev + 1
        if (next >= text.length) {
          window.clearInterval(interval)
          onComplete?.()
        }
        return next
      })
    }, speedMs)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speedMs])

  return (
    <span className={className}>
      {text.slice(0, visibleChars)}
      {cursor && visibleChars < text.length && <span className="gl-animate-flicker">▌</span>}
    </span>
  )
}

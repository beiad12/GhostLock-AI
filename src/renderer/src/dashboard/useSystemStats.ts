import { useEffect, useState } from 'react'
import type { SystemStatsSnapshot } from '../../../main/windowsIntegration/systemStats'

/** Polls the main process for live CPU/RAM/disk/battery telemetry. */
export function useSystemStats(intervalMs = 2500): SystemStatsSnapshot | null {
  const [stats, setStats] = useState<SystemStatsSnapshot | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll(): Promise<void> {
      try {
        const snapshot = await window.api.system.stats()
        if (!cancelled) setStats(snapshot)
      } catch {
        // Main process unavailable (e.g. browser preview) — leave stats null.
      }
    }
    poll()
    const id = window.setInterval(poll, intervalMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [intervalMs])

  return stats
}

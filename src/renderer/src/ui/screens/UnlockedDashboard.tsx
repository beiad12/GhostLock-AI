import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSystemStats } from '../../dashboard/useSystemStats'
import { StatCard } from '../../dashboard/StatCard'
import { useFlowStore } from '../../store/flowStore'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { HexOverlay } from '../../animations/HexOverlay'
import { ParticleField } from '../../animations/ParticleField'
import { useInactivityAutoLock } from '../../utils/useInactivityAutoLock'
import { useUnlockedGuard } from '../../authentication/useUnlockedGuard'

export function UnlockedDashboard(): React.JSX.Element {
  const stats = useSystemStats()
  const userName = useFlowStore((s) => s.lastAuthenticatedUser)
  const goTo = useFlowStore((s) => s.goTo)
  const setSettingsOpen = useFlowStore((s) => s.setSettingsOpen)
  const attemptLog = useAuthStore((s) => s.attemptLog)
  const autoLockMinutes = useSettingsStore((s) => s.settings.autoLockMinutes)
  const [sessionStart] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useInactivityAutoLock(true, autoLockMinutes, () => {
    void window.api.window.lockDesktop()
    goTo('scan')
  })

  useUnlockedGuard(true)

  const sessionSeconds = Math.floor((now - sessionStart) / 1000)
  const sessionLabel = `${String(Math.floor(sessionSeconds / 60)).padStart(2, '0')}:${String(sessionSeconds % 60).padStart(2, '0')}`
  const clock = new Date(now).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const recent = attemptLog.slice(0, 6)

  async function handleLock(): Promise<void> {
    await window.api.window.lockDesktop()
    goTo('scan')
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--gl-background)]">
      <HexOverlay className="absolute inset-0 opacity-20" />
      <ParticleField density={25} className="absolute inset-0" />

      <div className="relative z-10 h-full w-full p-8 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div
              className="gl-mono text-xs uppercase tracking-widest"
              style={{ color: 'var(--gl-text-muted)' }}
            >
              Session active — {userName ?? 'Operator'}
            </div>
            <div
              className="gl-mono text-4xl mt-1 gl-glow-text"
              style={{ color: 'var(--gl-accent)' }}
            >
              {clock}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSettingsOpen(true)}
              className="gl-glass rounded-lg px-4 py-2 gl-mono text-xs uppercase"
              style={{ color: 'var(--gl-text-secondary)' }}
            >
              Settings
            </button>
            <button
              onClick={handleLock}
              className="gl-glass rounded-lg px-4 py-2 gl-mono text-xs uppercase"
              style={{ color: 'var(--gl-danger)' }}
            >
              Lock Desktop
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="CPU Load"
            value={stats ? `${stats.cpuLoad}%` : '—'}
            percent={stats?.cpuLoad}
          />
          <StatCard
            label="Memory"
            value={stats ? `${stats.memUsedPercent}%` : '—'}
            percent={stats?.memUsedPercent}
          />
          <StatCard
            label="Disk"
            value={stats ? `${stats.diskUsedPercent}%` : '—'}
            percent={stats?.diskUsedPercent}
          />
          <StatCard
            label="Battery"
            value={
              stats?.batteryPercent !== null && stats?.batteryPercent !== undefined
                ? `${stats.batteryPercent}%`
                : 'N/A'
            }
            percent={stats?.batteryPercent ?? undefined}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="gl-glass rounded-xl p-5"
          >
            <div
              className="gl-mono text-xs uppercase tracking-widest mb-4"
              style={{ color: 'var(--gl-accent)' }}
            >
              Session
            </div>
            <div
              className="gl-mono text-sm space-y-2"
              style={{ color: 'var(--gl-text-secondary)' }}
            >
              <div>Duration: {sessionLabel}</div>
              <div>
                Temperature:{' '}
                {stats?.temperatureC !== null && stats?.temperatureC !== undefined
                  ? `${stats.temperatureC}°C`
                  : 'N/A'}
              </div>
              <div>
                Charging:{' '}
                {stats?.isCharging === null || stats?.isCharging === undefined
                  ? 'N/A'
                  : stats.isCharging
                    ? 'Yes'
                    : 'No'}
              </div>
              <div>Encryption: AES-256-GCM</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="gl-glass rounded-xl p-5 overflow-y-auto"
          >
            <div
              className="gl-mono text-xs uppercase tracking-widest mb-4"
              style={{ color: 'var(--gl-accent)' }}
            >
              Recent Security Events
            </div>
            {recent.length === 0 && (
              <div className="gl-mono text-xs" style={{ color: 'var(--gl-text-muted)' }}>
                No events yet
              </div>
            )}
            <div className="space-y-2">
              {recent.map((entry) => (
                <div key={entry.id} className="flex justify-between gl-mono text-xs">
                  <span style={{ color: entry.success ? 'var(--gl-success)' : 'var(--gl-danger)' }}>
                    {entry.success ? 'GRANTED' : 'DENIED'} {entry.userName ?? 'Unknown'}
                  </span>
                  <span style={{ color: 'var(--gl-text-muted)' }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

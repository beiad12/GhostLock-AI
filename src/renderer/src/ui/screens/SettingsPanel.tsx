import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'
import { useFlowStore } from '../../store/flowStore'
import { THEME_LIST } from '../../themes/definitions'
import { Toggle } from '../components/Toggle'
import { SliderField } from '../components/SliderField'
import { useCameraDevices } from '../../settings/useCameraDevices'
import { exportProfileBundle, importProfileBundle } from '../../settings/profileBackup'
import type { AnimationIntensity, Language } from '../../types/settings'

export function SettingsPanel(): React.JSX.Element {
  const open = useFlowStore((s) => s.settingsOpen)
  const setOpen = useFlowStore((s) => s.setSettingsOpen)
  const { settings, update, setTheme } = useSettingsStore()
  const removeUser = useAuthStore((s) => s.removeUser)
  const enrolledUsers = useAuthStore((s) => s.enrolledUsers)
  const initAuth = useAuthStore((s) => s.init)
  const cameras = useCameraDevices()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  async function handleAutoStartupToggle(next: boolean): Promise<void> {
    update('autoStartup', next)
    await window.api.autoLaunch.set(next)
  }

  async function handleExport(): Promise<void> {
    try {
      await exportProfileBundle()
      setStatus('Profile exported')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Export failed')
    }
  }

  async function handleImport(file: File): Promise<void> {
    try {
      await importProfileBundle(file)
      await initAuth(true)
      setStatus('Profile imported — restart scan to apply')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import failed')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="gl-glass h-full w-[420px] p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="gl-mono text-sm uppercase tracking-[0.3em]"
                style={{ color: 'var(--gl-accent)' }}
              >
                System Configuration
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="gl-mono text-sm"
                style={{ color: 'var(--gl-text-muted)' }}
              >
                CLOSE
              </button>
            </div>

            <Section title="Themes">
              <div className="grid grid-cols-2 gap-2">
                {THEME_LIST.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className="rounded-lg p-3 text-left border transition-colors"
                    style={{
                      borderColor:
                        settings.theme === theme.id
                          ? theme.colors.accent
                          : 'var(--gl-glass-border)',
                      background:
                        settings.theme === theme.id ? theme.colors.accentSoft : 'transparent'
                    }}
                  >
                    <div
                      className="h-2 w-8 rounded-full mb-2"
                      style={{ background: theme.colors.accent }}
                    />
                    <div className="gl-mono text-xs" style={{ color: 'var(--gl-text-primary)' }}>
                      {theme.name}
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Recognition">
              <SliderField
                label="Sensitivity"
                value={settings.sensitivity}
                onChange={(v) => update('sensitivity', v)}
              />
              <SliderField
                label="Confidence Threshold"
                value={settings.confidenceThreshold}
                onChange={(v) => update('confidenceThreshold', v)}
              />
              <SliderField
                label="Max Failed Attempts"
                value={settings.maxFailedAttempts}
                min={1}
                max={10}
                suffix=""
                onChange={(v) => update('maxFailedAttempts', v)}
              />
              <SliderField
                label="Auto-Lock After Inactivity"
                value={settings.autoLockMinutes}
                min={1}
                max={30}
                suffix=" min"
                onChange={(v) => update('autoLockMinutes', v)}
              />
            </Section>

            <Section title="Camera">
              <select
                value={settings.cameraDeviceId ?? ''}
                onChange={(e) => update('cameraDeviceId', e.target.value || null)}
                className="w-full bg-black/40 border rounded-lg px-3 py-2 gl-mono text-sm"
                style={{ borderColor: 'var(--gl-glass-border)', color: 'var(--gl-text-primary)' }}
              >
                <option value="">System Default</option>
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Section>

            <Section title="Interface">
              <div className="flex gap-2 mb-2">
                {(['low', 'balanced', 'high'] as AnimationIntensity[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => update('animationIntensity', level)}
                    className="flex-1 rounded-lg py-2 gl-mono text-xs uppercase border"
                    style={{
                      borderColor:
                        settings.animationIntensity === level
                          ? 'var(--gl-accent)'
                          : 'var(--gl-glass-border)',
                      color:
                        settings.animationIntensity === level
                          ? 'var(--gl-accent)'
                          : 'var(--gl-text-muted)'
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <select
                value={settings.language}
                onChange={(e) => update('language', e.target.value as Language)}
                className="w-full bg-black/40 border rounded-lg px-3 py-2 gl-mono text-sm mt-2"
                style={{ borderColor: 'var(--gl-glass-border)', color: 'var(--gl-text-primary)' }}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
              </select>
            </Section>

            <Section title="Audio & Voice">
              <Toggle
                checked={settings.voiceEnabled}
                onChange={(v) => update('voiceEnabled', v)}
                label="AI Voice"
              />
              <Toggle
                checked={settings.soundsEnabled}
                onChange={(v) => update('soundsEnabled', v)}
                label="Sound Effects"
              />
              <SliderField
                label="Master Volume"
                value={settings.masterVolume}
                onChange={(v) => update('masterVolume', v)}
              />
            </Section>

            <Section title="System">
              <Toggle
                checked={settings.autoStartup}
                onChange={handleAutoStartupToggle}
                label="Launch at Windows Startup"
              />
              <Toggle
                checked={settings.notificationsEnabled}
                onChange={(v) => update('notificationsEnabled', v)}
                label="Notifications"
              />
            </Section>

            <Section title="Enrolled Face">
              <div className="gl-mono text-xs mb-2" style={{ color: 'var(--gl-text-muted)' }}>
                GhostLock AI is a single-face device lock — enrolling a new face replaces this one,
                it does not add another user.
              </div>
              {enrolledUsers.length === 0 && (
                <div className="gl-mono text-xs" style={{ color: 'var(--gl-text-muted)' }}>
                  No face enrolled yet
                </div>
              )}
              {enrolledUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1.5">
                  <span className="gl-mono text-sm" style={{ color: 'var(--gl-text-secondary)' }}>
                    {u.name}
                  </span>
                  <button
                    onClick={() => removeUser(u.id)}
                    className="gl-mono text-xs"
                    style={{ color: 'var(--gl-danger)' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </Section>

            <Section title="Backup">
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 rounded-lg py-2 gl-mono text-xs uppercase border"
                  style={{ borderColor: 'var(--gl-glass-border)', color: 'var(--gl-accent)' }}
                >
                  Export Profile
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-lg py-2 gl-mono text-xs uppercase border"
                  style={{ borderColor: 'var(--gl-glass-border)', color: 'var(--gl-accent)' }}
                >
                  Import Profile
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glvault,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImport(file)
                  }}
                />
              </div>
              {status && (
                <div className="gl-mono text-xs mt-2" style={{ color: 'var(--gl-text-muted)' }}>
                  {status}
                </div>
              )}
            </Section>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Section({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="mb-6">
      <div
        className="gl-mono text-xs uppercase tracking-widest mb-2"
        style={{ color: 'var(--gl-text-muted)' }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

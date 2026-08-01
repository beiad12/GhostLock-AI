import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useFlowStore } from './store/flowStore'
import { useSettingsStore } from './store/settingsStore'
import { useAuthStore } from './store/authStore'
import { applyTheme } from './themes/applyTheme'
import { setMasterVolume } from './audio/soundEngine'
import { BootScreen } from './ui/screens/BootScreen'
import { EnrollScreen } from './ui/screens/EnrollScreen'
import { FaceScanScreen } from './ui/screens/FaceScanScreen'
import { AccessGrantedScreen } from './ui/screens/AccessGrantedScreen'
import { AccessDeniedScreen } from './ui/screens/AccessDeniedScreen'
import { UnlockedDashboard } from './ui/screens/UnlockedDashboard'
import { IntruderLockScreen } from './ui/screens/IntruderLockScreen'
import { SettingsPanel } from './ui/screens/SettingsPanel'

function App(): React.JSX.Element {
  const stage = useFlowStore((s) => s.stage)
  const goTo = useFlowStore((s) => s.goTo)
  const setSettingsOpen = useFlowStore((s) => s.setSettingsOpen)
  const settings = useSettingsStore((s) => s.settings)
  const initAuth = useAuthStore((s) => s.init)
  const enrolledUsers = useAuthStore((s) => s.enrolledUsers)

  useEffect(() => {
    applyTheme(settings.theme)
    setMasterVolume(settings.masterVolume)
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mirrors auth state into the main process, which uses it to gate the
  // in-window hide-to-tray button before authentication. Quitting the app
  // entirely is NOT gated on this — see main/index.ts and tray.ts for why:
  // a lock screen with no guaranteed exit is a hazard, not a feature.
  useEffect(() => {
    window.api.app.setAuthState(stage === 'unlocked')
  }, [stage])

  function handleBootComplete(): void {
    goTo(enrolledUsers.length > 0 ? 'scan' : 'enroll')
  }

  // If the enrolled profile gets removed (e.g. via Settings) while on any
  // pre-auth screen, there's nothing to scan against — route back to
  // enrollment instead of leaving the app scanning against nobody forever.
  useEffect(() => {
    if (
      enrolledUsers.length === 0 &&
      (stage === 'scan' || stage === 'granted' || stage === 'denied' || stage === 'intruderLock')
    ) {
      goTo('enroll')
    }
  }, [enrolledUsers.length, stage, goTo])

  return (
    <div className="h-full w-full relative gl-cursor-crosshair">
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="h-full w-full"
        >
          {stage === 'boot' && <BootScreen onComplete={handleBootComplete} />}
          {stage === 'enroll' && <EnrollScreen />}
          {stage === 'scan' && <FaceScanScreen />}
          {stage === 'granted' && <AccessGrantedScreen />}
          {stage === 'denied' && <AccessDeniedScreen />}
          {stage === 'unlocked' && <UnlockedDashboard />}
          {stage === 'intruderLock' && <IntruderLockScreen />}
        </motion.div>
      </AnimatePresence>

      {(stage === 'scan' || stage === 'unlocked') && (
        <button
          onClick={() => setSettingsOpen(true)}
          className="fixed top-6 right-16 z-40 gl-glass rounded-full h-11 w-11 flex items-center justify-center gl-mono text-lg"
          style={{ color: 'var(--gl-accent)' }}
          aria-label="Open settings"
        >
          ⚙
        </button>
      )}

      {stage === 'unlocked' && (
        <button
          onClick={() => window.api.window.hideToTray()}
          className="fixed top-6 right-6 z-40 gl-glass rounded-full h-11 w-11 flex items-center justify-center gl-mono text-lg"
          style={{ color: 'var(--gl-text-secondary)' }}
          aria-label="Hide GhostLock AI to the system tray"
          title="Hide to tray — GhostLock AI keeps running in the background"
        >
          ✕
        </button>
      )}

      {stage !== 'unlocked' && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 gl-mono text-[11px] tracking-wide px-3 py-1 rounded-full gl-glass"
          style={{ color: 'var(--gl-text-muted)' }}
        >
          Emergency exit: Ctrl+Alt+Q — or right-click the tray icon → Quit
        </div>
      )}

      <SettingsPanel />
    </div>
  )
}

export default App

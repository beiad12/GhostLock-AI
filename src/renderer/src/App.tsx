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

  function handleBootComplete(): void {
    goTo(enrolledUsers.length > 0 ? 'scan' : 'enroll')
  }

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
        </motion.div>
      </AnimatePresence>

      {(stage === 'scan' || stage === 'unlocked') && (
        <button
          onClick={() => setSettingsOpen(true)}
          className="fixed top-6 right-6 z-40 gl-glass rounded-full h-11 w-11 flex items-center justify-center gl-mono text-lg"
          style={{ color: 'var(--gl-accent)' }}
          aria-label="Open settings"
        >
          ⚙
        </button>
      )}

      <SettingsPanel />
    </div>
  )
}

export default App

import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

import { Header } from './components/Header'
import { RecorderView } from './screens/RecorderView'
import { SettingsView } from './screens/SettingsView'
import { SessionsView } from './screens/SessionsView'
import { useGameStatus } from './hooks/useGameStatus'
import { useLeagueRecorder } from './hooks/useLeagueRecorder'
import { useRecorderSettings } from './hooks/useRecorderSettings'
import { useDarkMode } from './hooks/useDarkMode'

function App() {
  const gameActive = useGameStatus()
  const { settings, setSettings } = useRecorderSettings()
  const { isDark, toggle: toggleDark } = useDarkMode()
  const { recordingState, elapsedSeconds, lastSavedPath, errorMessage, startRecording, stopRecording } =
    useLeagueRecorder(settings)
  const location = useLocation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault()
        window.location.reload()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (gameActive) {
      void startRecording()
      return
    }

    stopRecording()
  }, [gameActive, startRecording, stopRecording])

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <Header
        gameActive={gameActive}
        recordingState={recordingState}
        isDark={isDark}
        onToggleDark={toggleDark}
      />

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div
          key={location.pathname}
          className="animate-in fade-in-50 slide-in-from-bottom-1 duration-300"
        >
          <Routes location={location}>
            <Route
              path="/"
              element={
                <RecorderView
                  gameActive={gameActive}
                  recordingState={recordingState}
                  elapsedSeconds={elapsedSeconds}
                  lastSavedPath={lastSavedPath}
                  errorMessage={errorMessage}
                  settings={settings}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsView
                  settings={settings}
                  onSettingsChange={setSettings}
                  isDark={isDark}
                  onToggleDark={toggleDark}
                />
              }
            />
            <Route path="/sessions" element={<SessionsView />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App

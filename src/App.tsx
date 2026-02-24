import { useEffect, useState } from 'react'

import { Header } from './components/Header'
import { RecorderView } from './components/RecorderView'
import { SettingsView } from './components/SettingsView'
import { useGameStatus } from './hooks/useGameStatus'
import { useLeagueRecorder } from './hooks/useLeagueRecorder'
import { useRecorderSettings } from './hooks/useRecorderSettings'
import type { AppPage } from './types/recorder'

function App() {
  const [page, setPage] = useState<AppPage>('recorder')
  const gameActive = useGameStatus()
  const { settings, setSettings } = useRecorderSettings()
  const { recordingState, elapsedSeconds, lastSavedPath, errorMessage, startRecording, stopRecording } =
    useLeagueRecorder(settings)

  useEffect(() => {
    if (gameActive) {
      void startRecording()
      return
    }

    stopRecording()
  }, [gameActive, startRecording, stopRecording])

  const settingsSummary = `${settings.resolution} @ ${settings.frameRate} FPS`

  return (
    <main className="min-h-screen w-full bg-zinc-950 p-6 text-zinc-100">
      <Header page={page} onPageChange={setPage} />

      {page === 'recorder' && (
        <RecorderView
          gameActive={gameActive}
          recordingState={recordingState}
          elapsedSeconds={elapsedSeconds}
          lastSavedPath={lastSavedPath}
          errorMessage={errorMessage}
          settingsSummary={settingsSummary}
        />
      )}

      {page === 'settings' && (
        <SettingsView settings={settings} onSettingsChange={setSettings} />
      )}
    </main>
  )
}

export default App

import { useCallback, useEffect, useRef, useState } from 'react'

type RecordingState = 'idle' | 'recording' | 'saving' | 'saved' | 'error'

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

function App() {
  const [gameActive, setGameActive] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [lastSavedPath, setLastSavedPath] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      return
    }

    recorder.stop()
  }, [])

  const startRecording = useCallback(async () => {
    if (recorderRef.current?.state === 'recording') {
      return
    }

    try {
      setErrorMessage(null)
      setLastSavedPath(null)

      const sources = await window.electronAPI.getDesktopSources()
      const leagueSource = sources.find((source) => source.name.toLowerCase().includes('league of legends'))
      const fallbackSource = sources.find((source) => source.name.toLowerCase().includes('screen')) ?? sources[0]
      const targetSource = leagueSource ?? fallbackSource

      if (!targetSource) {
        throw new Error('No desktop source available to record.')
      }

      const captureSource = async (sourceId: string) => {
        return navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
            },
          } as MediaTrackConstraints,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
            },
          } as MediaTrackConstraints,
        })
      }

      let stream = await captureSource(targetSource.id)

      // Some platforms do not provide system audio for window-level capture.
      if (stream.getAudioTracks().length === 0 && fallbackSource && fallbackSource.id !== targetSource.id) {
        stream.getTracks().forEach((track) => track.stop())
        stream = await captureSource(fallbackSource.id)
      }

      const preferredMimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ]
      const selectedMimeType = preferredMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType))

      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream)

      chunksRef.current = []
      streamRef.current = stream
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          setRecordingState('saving')
          clearTimer()

          const blob = new Blob(chunksRef.current, { type: selectedMimeType ?? 'video/webm' })
          const recordingBuffer = await blob.arrayBuffer()
          const savedPath = await window.electronAPI.saveRecording(recordingBuffer)
          setLastSavedPath(savedPath)
          setRecordingState('saved')
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save recording.'
          setErrorMessage(message)
          setRecordingState('error')
        } finally {
          chunksRef.current = []
          recorderRef.current = null
          startedAtRef.current = null
          releaseStream()
          setElapsedSeconds(0)
        }
      }

      recorder.start(1000)
      setRecordingState('recording')
      setElapsedSeconds(0)
      startedAtRef.current = Date.now()
      clearTimer()
      timerRef.current = window.setInterval(() => {
        const startedAt = startedAtRef.current
        if (!startedAt) {
          return
        }

        const elapsed = Math.floor((Date.now() - startedAt) / 1000)
        setElapsedSeconds(elapsed)
      }, 1000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording.'
      setErrorMessage(message)
      setRecordingState('error')
      clearTimer()
      releaseStream()
    }
  }, [clearTimer, releaseStream])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onGameStatus(({ active }) => {
      setGameActive(active)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (gameActive) {
      void startRecording()
      return
    }

    stopRecording()
  }, [gameActive, startRecording, stopRecording])

  useEffect(() => {
    return () => {
      clearTimer()
      stopRecording()
      releaseStream()
    }
  }, [clearTimer, releaseStream, stopRecording])

  const statusText = gameActive ? 'Game detected' : 'Waiting for game...'

  return (
    <main className="mx-auto mt-10 max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-lg">
      <h1 className="text-2xl font-semibold">League of Legends Gameplay Recorder</h1>
      <p className="mt-2 text-sm text-zinc-400">
        The app records only while an active match is detected. Opening the client alone does not start recording.
      </p>

      <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              recordingState === 'recording' ? 'bg-red-500' : gameActive ? 'bg-emerald-500' : 'bg-zinc-500'
            }`}
          />
          <p className="font-medium">{statusText}</p>
        </div>

        <p className="mt-3 text-sm text-zinc-300">
          Recorder status:{' '}
          <span className="font-medium capitalize">
            {recordingState === 'idle' ? 'idle' : recordingState}
          </span>
        </p>

        {recordingState === 'recording' && (
          <p className="mt-2 text-sm text-zinc-200">Recording time: {formatElapsed(elapsedSeconds)}</p>
        )}

        {recordingState === 'saving' && (
          <p className="mt-2 text-sm text-zinc-200">Saving recording to disk...</p>
        )}

        {lastSavedPath && recordingState === 'saved' && (
          <p className="mt-2 break-all text-sm text-zinc-200">Saved: {lastSavedPath}</p>
        )}

        {errorMessage && (
          <p className="mt-2 text-sm text-red-400">Error: {errorMessage}</p>
        )}
      </section>
    </main>
  )
}

export default App

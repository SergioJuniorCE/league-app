import { useRef, useState, useEffect } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  Scissors,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecordingSession } from '../types/sessions'

const SPEED_PRESETS = [0.25, 0.5, 1, 1.5, 2, 4]

function formatSec(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00.0'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 10)
  return `${m}:${String(sec).padStart(2, '0')}.${ms}`
}

type ExportStatus = 'idle' | 'exporting' | 'done' | 'error'

type Props = {
  src: string
  filePath: string
  onExportDone?: (session: RecordingSession) => void
}

export function VideoEditorPanel({ src, filePath, onExportDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [inPoint, setInPoint] = useState<number | null>(null)
  const [outPoint, setOutPoint] = useState<number | null>(null)
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [exportError, setExportError] = useState<string | null>(null)

  // Reset state when the video source changes
  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setInPoint(null)
    setOutPoint(null)
    setExportStatus('idle')
    setExportError(null)
    setSpeed(1)

    const video = videoRef.current
    if (video) {
      video.load()
      video.playbackRate = 1
    }
  }, [src])

  // Sync playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }, [speed])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current
    const video = videoRef.current
    if (!track || !video || !duration) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const t = ratio * duration
    video.currentTime = t
    setCurrentTime(t)
  }

  const pct = (t: number) => (duration > 0 ? (t / duration) * 100 : 0)

  const inPct = inPoint !== null ? pct(inPoint) : null
  const outPct = outPoint !== null ? pct(outPoint) : null

  const canExport = inPoint !== null || outPoint !== null || speed !== 1

  const handleExport = async () => {
    if (!canExport) return
    setExportStatus('exporting')
    setExportError(null)

    try {
      const result = await window.electronAPI.exportRecording({
        sourcePath: filePath,
        startSec: inPoint ?? undefined,
        endSec: outPoint ?? undefined,
        speedMultiplier: speed !== 1 ? speed : undefined,
      })

      if (result.success && result.session) {
        setExportStatus('done')
        onExportDone?.(result.session)
      } else {
        setExportStatus('error')
        setExportError(result.error ?? 'Export failed')
      }
    } catch (err) {
      setExportStatus('error')
      setExportError(String(err))
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Video */}
      <div className="flex flex-1 items-center justify-center overflow-hidden rounded-md bg-black min-h-0">
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-contain"
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      </div>

      {/* Timeline */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-2.5 cursor-pointer rounded-full bg-zinc-700 select-none group"
      >
        {/* Played region */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-red-500/70 pointer-events-none"
          style={{ width: `${pct(currentTime)}%` }}
        />

        {/* In/Out region highlight */}
        {inPct !== null && (
          <div
            className="absolute inset-y-0 bg-amber-400/35 pointer-events-none"
            style={{
              left: `${inPct}%`,
              width: outPct !== null ? `${outPct - inPct}%` : undefined,
              right: outPct !== null ? undefined : 0,
            }}
          />
        )}

        {/* In marker line */}
        {inPct !== null && (
          <div
            className="absolute inset-y-0 w-px bg-amber-400 pointer-events-none"
            style={{ left: `${inPct}%` }}
          />
        )}

        {/* Out marker line */}
        {outPct !== null && (
          <div
            className="absolute inset-y-0 w-px bg-amber-400 pointer-events-none"
            style={{ left: `${outPct}%` }}
          />
        )}

        {/* Playhead */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border border-zinc-400 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"
          style={{ left: `${pct(currentTime)}%` }}
        />
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0
              setCurrentTime(0)
            }
          }}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          title="Back to start"
        >
          <SkipBack size={14} />
        </button>

        <button
          onClick={togglePlay}
          className="rounded-full p-1.5 bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors"
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <span className="text-xs text-zinc-400 font-mono tabular-nums ml-1">
          {formatSec(currentTime)}
          <span className="text-zinc-600"> / {formatSec(duration)}</span>
        </span>

        <div className="flex-1" />

        {/* Speed presets */}
        <div className="flex items-center gap-0.5">
          {SPEED_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                'rounded px-1.5 py-1 text-[11px] font-mono transition-colors',
                speed === s
                  ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300',
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Markers + Export */}
      <div className="flex items-center gap-2 border-t border-zinc-800 pt-2.5">
        <button
          onClick={() => setInPoint(currentTime)}
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          title="Set In point at current time"
        >
          <Scissors size={10} />
          In
        </button>

        <span
          className={cn(
            'font-mono text-[11px] min-w-[52px]',
            inPoint !== null ? 'text-amber-400' : 'text-zinc-600',
          )}
        >
          {inPoint !== null ? formatSec(inPoint) : '—'}
        </span>

        <button
          onClick={() => setOutPoint(currentTime)}
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          title="Set Out point at current time"
        >
          <Scissors size={10} className="scale-x-[-1]" />
          Out
        </button>

        <span
          className={cn(
            'font-mono text-[11px] min-w-[52px]',
            outPoint !== null ? 'text-amber-400' : 'text-zinc-600',
          )}
        >
          {outPoint !== null ? formatSec(outPoint) : '—'}
        </span>

        {(inPoint !== null || outPoint !== null) && (
          <button
            onClick={() => {
              setInPoint(null)
              setOutPoint(null)
            }}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Clear markers"
          >
            <X size={11} />
          </button>
        )}

        <div className="flex-1" />

        {/* Export button / status */}
        {exportStatus === 'idle' && (
          <button
            onClick={() => void handleExport()}
            disabled={!canExport}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-medium bg-red-500/15 text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              canExport
                ? 'Export edited clip as new recording'
                : 'Set In/Out markers or change speed to enable export'
            }
          >
            <Download size={11} />
            Export Edit
          </button>
        )}

        {exportStatus === 'exporting' && (
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Loader2 size={11} className="animate-spin" />
            Exporting…
          </span>
        )}

        {exportStatus === 'done' && (
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 size={11} />
            Exported!
          </span>
        )}

        {exportStatus === 'error' && (
          <span className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle size={11} />
              {exportError ?? 'Export failed'}
            </span>
            <button
              onClick={() => setExportStatus('idle')}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Retry
            </button>
          </span>
        )}
      </div>
    </div>
  )
}

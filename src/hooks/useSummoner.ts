import { useCallback, useEffect, useRef, useState } from 'react'

import type { RiotProfileBundle } from '../types/riot'
import { isRiotConfigured, type RiotSettings } from './useRiotSettings'

type Status = 'idle' | 'loading' | 'success' | 'error'

type State = {
  status: Status
  data: RiotProfileBundle | null
  error: string | null
  lastFetchedAt: number | null
}

const INITIAL_STATE: State = {
  status: 'idle',
  data: null,
  error: null,
  lastFetchedAt: null,
}

/**
 * Fetches the Riot summoner bundle (profile, rank, recent matches).
 * Re-fetches when Riot settings change or `refreshKey` bumps.
 */
export function useSummoner(settings: RiotSettings, refreshKey = 0) {
  const [state, setState] = useState<State>(INITIAL_STATE)
  const requestIdRef = useRef(0)

  const fetchBundle = useCallback(async () => {
    if (!isRiotConfigured(settings)) {
      setState(INITIAL_STATE)
      return
    }

    const reqId = ++requestIdRef.current
    setState((prev) => ({ ...prev, status: 'loading', error: null }))

    try {
      const result = await window.electronAPI.getRiotSummoner({
        platform: settings.platform,
        gameName: settings.gameName.trim(),
        tagLine: settings.tagLine.replace(/^#/, '').trim(),
        apiKey: settings.apiKey.trim(),
        matchCount: 5,
      })

      if (reqId !== requestIdRef.current) {
        return
      }

      if (result.success) {
        setState({
          status: 'success',
          data: result.data,
          error: null,
          lastFetchedAt: Date.now(),
        })
      } else {
        setState({
          status: 'error',
          data: null,
          error: result.error,
          lastFetchedAt: Date.now(),
        })
      }
    } catch (err) {
      if (reqId !== requestIdRef.current) return
      setState({
        status: 'error',
        data: null,
        error: err instanceof Error ? err.message : String(err),
        lastFetchedAt: Date.now(),
      })
    }
  }, [settings])

  useEffect(() => {
    void fetchBundle()
  }, [fetchBundle, refreshKey])

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    lastFetchedAt: state.lastFetchedAt,
    refetch: fetchBundle,
  }
}

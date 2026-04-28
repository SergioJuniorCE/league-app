import { useEffect, useState } from 'react'

import { PLATFORM_REGIONS, type PlatformRegion } from '../types/riot'

export type RiotSettings = {
  gameName: string
  tagLine: string
  platform: PlatformRegion
}

const RIOT_SETTINGS_KEY = 'crux-riot-settings'

export const DEFAULT_RIOT_SETTINGS: RiotSettings = {
  gameName: '',
  tagLine: '',
  platform: 'na1',
}

function loadRiotSettings(): RiotSettings {
  try {
    const raw = localStorage.getItem(RIOT_SETTINGS_KEY)
    if (!raw) {
      return DEFAULT_RIOT_SETTINGS
    }

    const parsed = JSON.parse(raw) as Partial<RiotSettings>
    const platform = PLATFORM_REGIONS.includes(parsed.platform as PlatformRegion)
      ? (parsed.platform as PlatformRegion)
      : DEFAULT_RIOT_SETTINGS.platform

    return {
      gameName: typeof parsed.gameName === 'string' ? parsed.gameName : '',
      tagLine: typeof parsed.tagLine === 'string' ? parsed.tagLine : '',
      platform,
    }
  } catch {
    return DEFAULT_RIOT_SETTINGS
  }
}

export function useRiotSettings() {
  const [settings, setSettings] = useState<RiotSettings>(loadRiotSettings)

  useEffect(() => {
    localStorage.setItem(RIOT_SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  return { settings, setSettings }
}

export function isRiotConfigured(
  settings: RiotSettings,
  options: { hasEnvKey?: boolean } = {},
): boolean {
  return (
    Boolean(options.hasEnvKey) &&
    Boolean(settings.gameName) &&
    Boolean(settings.tagLine)
  )
}

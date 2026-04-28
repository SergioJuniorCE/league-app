import { Flame } from 'lucide-react'

import type { RiotLeagueEntry } from '../../types/riot'
import { tierStyle } from '@/lib/leagueAssets'
import { cn } from '@/lib/utils'
import { Badge } from './Badge'
import { formatQueue, formatTier, winRate } from './utils'

export function RankedPanel({ entry, icon }: { entry: RiotLeagueEntry; icon: React.ReactNode }) {
  const wr = winRate(entry.wins, entry.losses)
  const style = tierStyle(entry.tier)

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {formatQueue(entry.queueType)}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-2',
            style.gradient,
            style.ring,
          )}
        >
          <span className={cn('font-mono text-sm font-black tracking-tight', style.text)}>
            {entry.tier.slice(0, 1)}
            <span className="text-[10px] font-bold">{entry.rank}</span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-base font-semibold text-foreground">
            {formatTier(entry)}
          </div>
          <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {entry.leaguePoints} LP
          </div>
        </div>
        <div className="text-right">
          <div
            className={cn(
              'font-mono text-base font-semibold tabular-nums',
              wr >= 60 ? 'text-emerald-300' : wr >= 50 ? 'text-foreground' : 'text-red-300',
            )}
          >
            {wr}%
          </div>
          <div className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {entry.wins}W · {entry.losses}L
          </div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className={cn(
            'h-full',
            wr >= 60
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-300'
              : wr >= 50
                ? 'bg-gradient-to-r from-emerald-500 to-primary'
                : 'bg-gradient-to-r from-red-500 to-amber-400',
          )}
          style={{ width: `${Math.max(wr, 4)}%` }}
        />
      </div>

      {(entry.hotStreak || entry.veteran || entry.freshBlood || entry.inactive) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.hotStreak && <Badge icon={<Flame size={10} />} tone="primary" label="Hot streak" />}
          {entry.veteran && <Badge label="Veteran" />}
          {entry.freshBlood && <Badge label="Fresh blood" />}
          {entry.inactive && <Badge tone="muted" label="Inactive" />}
        </div>
      )}
    </section>
  )
}

export function EmptyRankedPanel({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card/50 p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <span className="text-muted-foreground/70">{icon}</span>
        {label}
      </div>
      <div className="mt-3 font-mono text-sm text-muted-foreground">Unranked</div>
      <p className="mt-0.5 text-[11px] text-muted-foreground/80">
        Play placement matches to rank this queue.
      </p>
    </section>
  )
}

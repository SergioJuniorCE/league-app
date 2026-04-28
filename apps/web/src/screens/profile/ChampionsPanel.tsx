import { Target } from 'lucide-react'

import { ddragonChampionSquare } from '@/lib/leagueAssets'
import { cn } from '@/lib/utils'
import type { ChampionStats } from './aggregate'
import { formatKda, winRate } from './utils'

export function ChampionsPanel({
  champions,
  version,
}: {
  champions: ChampionStats[]
  version: string
}) {
  if (champions.length === 0) return null
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <Target size={12} />
        Champion performance
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {champions.slice(0, 8).map((c) => {
          const wr = winRate(c.wins, c.losses)
          const kda = formatKda(c.kills, c.deaths, c.assists)
          return (
            <li
              key={c.championName}
              className="flex items-center gap-2.5 rounded-md bg-background/30 px-2 py-1.5"
            >
              <img
                src={ddragonChampionSquare(version, c.championName)}
                alt={c.championName}
                className="h-8 w-8 shrink-0 rounded-md border border-border object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-foreground">
                  {c.championName}
                </div>
                <div className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {kda} KDA
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div
                  className={cn(
                    'font-mono text-[12px] font-semibold tabular-nums',
                    wr >= 60 ? 'text-emerald-300' : wr >= 50 ? 'text-foreground' : 'text-red-300',
                  )}
                >
                  {wr}%
                </div>
                <div className="font-mono text-[9px] tabular-nums text-muted-foreground">
                  {c.games}G
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

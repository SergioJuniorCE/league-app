import { Shield } from 'lucide-react'

import { ROLE_LABELS } from '@/lib/leagueAssets'
import { cn } from '@/lib/utils'
import type { RoleStats } from './aggregate'

export function RolesPanel({ roles }: { roles: RoleStats[] }) {
  if (roles.length === 0) return null
  const totalGames = roles.reduce((sum, r) => sum + r.games, 0)

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <Shield size={12} />
        Role performance
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {roles.map((r) => {
          const wr = r.games > 0 ? Math.round((r.wins / r.games) * 100) : 0
          const shareWidth = totalGames > 0 ? (r.games / totalGames) * 100 : 0
          return (
            <li key={r.role}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
                  {ROLE_LABELS[r.role] ?? r.role}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {r.games}G ·{' '}
                  <span
                    className={cn(
                      wr >= 60 ? 'text-emerald-300' : wr >= 50 ? 'text-foreground' : 'text-red-300',
                    )}
                  >
                    {wr}%
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full bg-primary/80"
                  style={{ width: `${Math.max(shareWidth, 3)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

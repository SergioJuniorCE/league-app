import { cn } from '@/lib/utils'
import { relativeTime } from './utils'

export function WinLossTrend({ recent }: { recent: { win: boolean; timestamp: number }[] }) {
  const series = [...recent].slice(0, 20).reverse()

  return (
    <div className="flex items-center gap-1">
      {series.map((r, i) => (
        <span
          key={i}
          title={`${r.win ? 'Win' : 'Loss'} · ${relativeTime(r.timestamp)}`}
          className={cn(
            'h-6 flex-1 min-w-[10px] rounded-sm',
            r.win ? 'bg-emerald-400/80' : 'bg-red-400/70',
          )}
        />
      ))}
    </div>
  )
}

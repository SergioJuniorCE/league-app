import type { AppPage } from '../types/recorder'

type HeaderProps = {
  page: AppPage
  onPageChange: (page: AppPage) => void
}

export function Header({ page, onPageChange }: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold">Crux</h1>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange('recorder')}
          className={`rounded-md px-3 py-1 text-sm ${
            page === 'recorder' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-200'
          }`}
        >
          Recorder
        </button>
        <button
          type="button"
          onClick={() => onPageChange('settings')}
          className={`rounded-md px-3 py-1 text-sm ${
            page === 'settings' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-200'
          }`}
        >
          Settings
        </button>
      </div>
    </div>
  )
}

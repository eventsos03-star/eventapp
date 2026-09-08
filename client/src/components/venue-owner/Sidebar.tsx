'use client'

import Link from 'next/link'

export type OwnerTab = 'dashboard' | 'venues' | 'availability' | 'bookings' | 'settings'

const TABS: { id: OwnerTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'venues', label: 'My Venues' },
  { id: 'availability', label: 'Availability' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'settings', label: 'Settings' },
]

export function Sidebar({
  active,
  onSelect,
  onClose,
}: {
  active: OwnerTab
  onSelect: (tab: OwnerTab) => void
  onClose?: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-8 bg-slate-950 px-5 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-sm font-black text-amber-400">
              E
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900">
              Event<span className="text-amber-500">OS</span>
            </span>
          </Link>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-slate-800 p-4 text-xs text-slate-400">
        <p className="font-semibold text-slate-200">Owner Dashboard</p>
        <p className="mt-1">Manage your venues, availability and booking requests.</p>
      </div>
    </div>
  )
}
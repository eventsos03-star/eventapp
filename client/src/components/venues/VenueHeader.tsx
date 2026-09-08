'use client'

import Link from 'next/link'

interface VenueHeaderProps {
  backHref?: string
  showAddVenue?: boolean
}

export default function VenueHeader({
  backHref = '/dashboard',
  showAddVenue = false,
}: VenueHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href={backHref} className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-sm font-black text-amber-400">
            E
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Event<span className="text-amber-500">OS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 sm:flex">
          <Link
            href="/venues"
            className="rounded-lg px-3 py-2 transition hover:text-amber-600"
          >
            Venues
          </Link>
        </nav>

        {showAddVenue && (
          <Link
            href="/venues/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Venue
          </Link>
        )}
      </div>
    </header>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '../../lib/api'
import type { Venue } from '../../types'

function VenueCard({ venue }: { venue: Venue }) {
 const cover = typeof venue.images?.[0] === 'string'
  ? venue.images[0]
  : (venue.images?.[0] as { url?: string } | undefined)?.url

  return (
    <Link
      href={`/venues/${venue._id}`}
      className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-amber-300"
    >
      <div className="relative w-32 sm:w-40 shrink-0 bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={venue.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-medium text-slate-400">
            No photo
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-600">
            {venue.name}
          </h3>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">{venue.location.city}</p>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Capacity
            </div>
            <div className="text-sm font-bold text-slate-900">
              {(venue.capacity ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Per day
            </div>
            <div className="text-sm font-bold text-slate-900">
              ₹{(venue.price ?? 0).toLocaleString()}
            </div>
          </div>
          <span
            className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold ${venue.status === 'approved'
                ? 'bg-emerald-50 text-emerald-600'
                : venue.status === 'pending'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-red-50 text-red-600'
              }`}
          >
            {venue.status}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function VenuePage() {
  const router = useRouter()

  // 'checking' = auth status unknown yet, 'authed' = confirmed logged in,
  // 'guest' = confirmed logged out. This replaces the old useAuth() race.
  const [authStatus, setAuthStatus] = useState<'checking' | 'authed' | 'guest'>('checking')

  const [venues, setVenues] = useState<Venue[] | null>(null)
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Check auth once on mount.
  useEffect(() => {
    let cancelled = false

    api
      .me()
      .then(() => {
        if (!cancelled) setAuthStatus('authed')
      })
      .catch(() => {
        if (!cancelled) setAuthStatus('guest')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Redirect only once we know for sure the user is logged out.
  useEffect(() => {
    if (authStatus === 'guest') {
      router.replace('/login')
    }
  }, [authStatus, router])

  // Only fetch venues once we know the user is authenticated.
  useEffect(() => {
    if (authStatus !== 'authed') return

    let cancelled = false
    setError(null)

    const timeout = setTimeout(() => {
      api
        .listVenues(city.trim() || undefined)
        .then(({ data }) => {
          if (!cancelled) setVenues(data ?? [])
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof ApiError ? err.message : 'Could not load venues.')
          }
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [authStatus, city])

  if (authStatus === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking your session…</p>
      </div>
    )
  }

  if (authStatus === 'guest') {
    // Redirect is in flight; render nothing to avoid a flash of content.
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base shadow-md">
              E
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-950">
              Event<span className="text-amber-500">OS</span>
            </span>
          </Link>

          <Link
            href="/venues/new"
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99]"
          >
            + Add Venue
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Venues
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Browse and manage bookable spaces.
            </p>
          </div>

          <div className="w-full sm:w-56">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Filter by city
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kochi"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!error && venues === null && (
          <p className="text-sm text-slate-500">Loading venues…</p>
        )}

        {!error && venues !== null && venues.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-base font-bold text-slate-900">No venues yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {city
                ? `Nothing in ${city} right now — try another city.`
                : 'Add your first venue to get started.'}
            </p>
            <Link
              href="/venues/new"
              className="mt-4 inline-flex rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
            >
              + Add Venue
            </Link>
          </div>
        )}

        {venues && venues.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {venues.map((venue) => (
              <VenueCard key={venue._id} venue={venue} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
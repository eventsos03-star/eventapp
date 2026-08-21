'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '../../lib/api'
import type { Venue } from '../../types'

function VenueCard({
  venue,
  isAdmin,
  onDelete,
  deletingId,
}: {
  venue: Venue
  isAdmin: boolean
  onDelete: (id: string) => void
  deletingId: string | null
}) {
  const cover =
    typeof venue.images?.[0] === 'string'
      ? venue.images[0]
      : (venue.images?.[0] as { url?: string } | undefined)?.url

  const isDeleting = deletingId === venue._id

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-300 hover:shadow-md">

      {/* VENUE DETAILS */}
      <Link
        href={`/venues/${venue._id}`}
        className="group flex"
      >
        {/* IMAGE */}
        <div className="relative w-32 shrink-0 bg-slate-100 sm:w-40">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={venue.venueName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-40 items-center justify-center text-xs font-medium text-slate-400">
              No photo
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">

          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 sm:text-lg">
              {venue.venueName}
            </h3>

            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              {venue.location.city}
            </p>
          </div>

          <div className="flex items-center gap-4">

            {/* CAPACITY */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Capacity
              </div>

              <div className="text-sm font-bold text-slate-900">
                {(venue.capacity ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            {/* PRICE */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Per day
              </div>

              <div className="text-sm font-bold text-slate-900">
                ₹{(venue.pricePerDay ?? 0).toLocaleString()}
              </div>
            </div>

            {/* STATUS */}
            <span
              className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                venue.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-600'
                  : venue.status === 'pending'
                    ? 'bg-amber-50 text-amber-600'
                    : venue.status === 'rejected'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-slate-100 text-slate-600'
              }`}
            >
              {venue.status}
            </span>
          </div>
        </div>
      </Link>

      {/* ADMIN DELETE ACTION */}
      {isAdmin && (
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-4 py-3">

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(venue._id)}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>

        </div>
      )}
    </div>
  )
}

export default function VenuePage() {
  const router = useRouter()

  const [authStatus, setAuthStatus] = useState<
    'checking' | 'authed' | 'guest'
  >('checking')

  const [user, setUser] = useState<any>(null)

  const [venues, setVenues] = useState<Venue[] | null>(null)

  const [city, setCity] = useState('')

  const [error, setError] = useState<string | null>(null)

  const [showMyVenues, setShowMyVenues] = useState(false)

  // NEW:
  // Stores the ID of the venue currently being deleted
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // --------------------------------------------------
  // CHECK AUTHENTICATION
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false

    api
      .me()
      .then(({ data }) => {
        if (!cancelled) {
          setUser(data)
          setAuthStatus('authed')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthStatus('guest')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // --------------------------------------------------
  // REDIRECT GUEST
  // --------------------------------------------------

  useEffect(() => {
    if (authStatus === 'guest') {
      router.replace('/login')
    }
  }, [authStatus, router])

  // --------------------------------------------------
  // LOAD VENUES
  // --------------------------------------------------

  useEffect(() => {
    if (authStatus !== 'authed') return

    let cancelled = false

    setError(null)
    setVenues(null)

    const timeout = setTimeout(() => {
      const request = showMyVenues
        ? api.getMyVenues()
        : api.listVenues(city.trim() || undefined)

      request
        .then(({ data }) => {
          if (!cancelled) {
            setVenues(data ?? [])
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(
              err instanceof ApiError
                ? err.message
                : 'Could not load venues.'
            )
          }
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [authStatus, showMyVenues, city])

  // --------------------------------------------------
  // ADMIN CHECK
  // --------------------------------------------------

  const isAdmin =
    String(user?.role ?? '').trim().toLowerCase() === 'admin'

  // --------------------------------------------------
  // DELETE VENUE - ADMIN ONLY
  // --------------------------------------------------

  const handleDelete = async (id: string) => {
    // Extra frontend protection
    if (!isAdmin) {
      setError('You are not authorized to delete venues.')
      return
    }

    const venue = venues?.find((item) => item._id === id)

    if (!venue) {
      setError('Venue not found.')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${venue.venueName}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeletingId(id)
      setError(null)

      // This calls your existing API method
      await api.deleteVenue(id)

      // Remove the deleted venue immediately from the UI
      setVenues((previous) =>
        previous
          ? previous.filter((item) => item._id !== id)
          : previous
      )

      alert('Venue deleted successfully.')
    } catch (err) {
      console.error('Delete venue error:', err)

      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to delete venue.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // --------------------------------------------------
  // LOADING AUTH
  // --------------------------------------------------

  if (authStatus === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Checking your session…
        </p>
      </div>
    )
  }

  // --------------------------------------------------
  // GUEST
  // --------------------------------------------------

  if (authStatus === 'guest') {
    return null
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">

      {/* --------------------------------------------------
          HEADER
      -------------------------------------------------- */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-base font-black text-amber-400 shadow-md">
              E
            </div>

            <span className="text-lg font-bold tracking-tight text-slate-950">
              Event<span className="text-amber-500">OS</span>
            </span>
          </Link>

          {/* ADD VENUE ONLY FOR NORMAL USERS */}

          {!isAdmin && (
            <Link
              href="/venues/new"
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99]"
            >
              + Add Venue
            </Link>
          )}

        </div>
      </header>

      {/* --------------------------------------------------
          MAIN
      -------------------------------------------------- */}

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-10">

        {/* TITLE + FILTER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {showMyVenues ? 'My Venues' : 'Venues'}
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {showMyVenues
                ? 'Manage the venues you have added.'
                : 'Browse approved bookable spaces.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

            {/* FILTER */}

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

            {/* MY VENUES ONLY FOR NORMAL USERS */}

            {!isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowMyVenues((previous) => !previous)
                  setCity('')
                }}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                  showMyVenues
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                {showMyVenues ? '← All Venues' : 'My Venues'}
              </button>
            )}

          </div>
        </div>

        {/* --------------------------------------------------
            ERROR
        -------------------------------------------------- */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* --------------------------------------------------
            LOADING
        -------------------------------------------------- */}

        {!error && venues === null && (
          <p className="text-sm text-slate-500">
            Loading venues…
          </p>
        )}

        {/* --------------------------------------------------
            NO VENUES
        -------------------------------------------------- */}

        {!error &&
          venues !== null &&
          venues.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

              <p className="text-base font-bold text-slate-900">
                {showMyVenues
                  ? 'You have not added any venues yet'
                  : 'No approved venues yet'}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {showMyVenues
                  ? 'Add your first venue to get started.'
                  : city
                    ? `No approved venues found in ${city}.`
                    : 'There are no approved venues available.'}
              </p>

              {!isAdmin && (
                <Link
                  href="/venues/new"
                  className="mt-4 inline-flex rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99]"
                >
                  + Add Venue
                </Link>
              )}

            </div>
          )}

        {/* --------------------------------------------------
            VENUE LIST
        -------------------------------------------------- */}

        {venues && venues.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">

            {venues.map((venue) => (
              <VenueCard
                key={venue._id}
                venue={venue}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}

          </div>
        )}

      </main>
    </div>
  )
}
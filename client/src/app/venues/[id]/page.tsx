'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api, ApiError } from '../../../lib/api'
import type { Venue, SafeUser } from '../../../types'
import VenueMap from '../../../components/maps/VenueMap'

export default function VenueDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const id = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [user, setUser] = useState<SafeUser | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

   const loadData = async () => {
  try {
    setLoading(true)
    setError(null)

    const [venueResponse, userResponse] = await Promise.all([
      api.getVenue(id),
      api.me(),
    ])

    if (cancelled) return

    const venueData = (venueResponse as { data: Venue }).data
    const userData = (userResponse as { data: SafeUser }).data

    setVenue(venueData)
    setUser(userData)
  } catch (err) {
    if (!cancelled) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not load venue.'
      )
    }
  } finally {
    if (!cancelled) {
      setLoading(false)
    }
  }
}

    if (id) {
      loadData()
    }

    return () => {
      cancelled = true
    }
  }, [id])

  // --------------------------------------------------
  // DELETE VENUE
  // --------------------------------------------------

  const handleDelete = async () => {
    if (!venue) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this venue?'
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      setError(null)

      await api.deleteVenue(venue._id)

      router.push('/venues')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not delete venue.'
      )
    } finally {
      setDeleting(false)
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading venue…
        </p>
      </div>
    )
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">

        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">

            <Link
              href="/dashboard"
              className="flex items-center gap-2.5"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base shadow-md">
                E
              </div>

              <span className="text-lg font-bold tracking-tight text-slate-950">
                Event<span className="text-amber-500">OS</span>
              </span>
            </Link>

            <Link
              href="/venues"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-amber-400 hover:text-amber-600"
            >
              ← All Venues
            </Link>

          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-10">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        </main>

      </div>
    )
  }

  // --------------------------------------------------
  // VENUE NOT FOUND
  // --------------------------------------------------

  if (!venue) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Venue not found.
        </p>
      </div>
    )
  }

  // --------------------------------------------------
  // OWNER CHECK
  // --------------------------------------------------

  const venueOwnerId =
    typeof venue.ownerId === 'object' && venue.ownerId !== null
      ? String(
          (venue.ownerId as { _id?: string })._id ??
            venue.ownerId
        )
      : String(venue.ownerId)

  const currentUserId = user?.id
    ? String(user.id)
    : ''

  const isOwner =
    !!currentUserId &&
    !!venueOwnerId &&
    currentUserId === venueOwnerId

  // --------------------------------------------------
  // ADMIN CHECK
  // --------------------------------------------------

  const isAdmin =
    String(user?.role ?? '').trim().toLowerCase() === 'admin'

  // --------------------------------------------------
  // PERMISSIONS
  // --------------------------------------------------

  // Normal user can edit ONLY their own venue.
  const canEditVenue =
    !isAdmin && isOwner

  // Owner can delete their own venue.
  // Admin can delete any venue.
  const canDeleteVenue =
    isAdmin || isOwner

  // --------------------------------------------------
  // COVER IMAGE
  // --------------------------------------------------

  const cover =
    typeof venue.images?.[0] === 'string'
      ? venue.images[0]
      : (
          venue.images?.[0] as
            | { url?: string }
            | undefined
        )?.url

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
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base shadow-md">
              E
            </div>

            <span className="text-lg font-bold tracking-tight text-slate-950">
              Event<span className="text-amber-500">OS</span>
            </span>
          </Link>

          <Link
            href="/venues"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600"
          >
            ← All Venues
          </Link>

        </div>

      </header>

      {/* --------------------------------------------------
          MAIN
      -------------------------------------------------- */}

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-10">

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-7 md:grid-cols-2">

          {/* --------------------------------------------------
              IMAGE
          -------------------------------------------------- */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={venue.venueName}
                className="h-[420px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-slate-400">
                No photo
              </div>
            )}

          </div>

          {/* --------------------------------------------------
              DETAILS
          -------------------------------------------------- */}

          <div className="flex flex-col">

            {/* STATUS REMOVED */}

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {venue.venueName}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {venue.location.address},{' '}
              {venue.location.city},{' '}
              {venue.location.state}
            </p>

            <p className="mt-5 text-sm leading-6 text-slate-600">
              {venue.description}
            </p>

            {/* --------------------------------------------------
                KPI CARDS
            -------------------------------------------------- */}

            <div className="mt-7 grid grid-cols-2 gap-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Capacity
                </div>

                <div className="mt-1 text-xl font-bold text-slate-900">
                  {(venue.capacity ?? 0).toLocaleString()}
                </div>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Price / Day
                </div>

                <div className="mt-1 text-xl font-bold text-amber-500">
                  ₹{(venue.pricePerDay ?? 0).toLocaleString()}
                </div>

              </div>

            </div>

            {/* --------------------------------------------------
                LOCATION MAP
            -------------------------------------------------- */}

            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Location</h2>
                {canEditVenue && (
                  <Link
                    href={`/venues/${venue._id}/edit`}
                    className="text-xs font-semibold text-amber-600 hover:underline"
                  >
                    Update location
                  </Link>
                )}
              </div>
              <VenueMap venue={venue} />
            </div>

            {/* --------------------------------------------------
                ACTIONS
            -------------------------------------------------- */}

            <div className="mt-6 flex flex-wrap gap-3">

              {/* EDIT ONLY FOR VENUE OWNER */}
              {canEditVenue && (
                <Link
                  href={`/venues/${venue._id}/edit`}
                  className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
                >
                  Edit Venue
                </Link>
              )}

              {/* DELETE FOR OWNER OR ADMIN */}
              {canDeleteVenue && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting
                    ? 'Deleting…'
                    : 'Delete Venue'}
                </button>
              )}

              {/* BACK */}
              <Link
                href="/venues"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Back to Venues
              </Link>

            </div>

          </div>

        </div>

      </main>

    </div>
  )
}
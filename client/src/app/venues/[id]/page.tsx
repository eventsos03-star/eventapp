'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { api, ApiError } from '../../../lib/api'
import type { Venue } from '../../../types'

export default function VenueDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [venue, setVenue] = useState<Venue | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) {
      router.replace('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (!id) return
    api
      .getVenue(id)
      .then(({ data }) => {
        if (data) setVenue(data)
        else setError('Could not load this venue.')
      })
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 404
            ? "This venue doesn't exist, or has been removed."
            : 'Could not load this venue.'
        )
      )
  }, [id])

  const cover = venue?.images?.[0]?.url

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      {/* Header, mirrors login / venue list */}
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
            href="/venues"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← All Venues
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-10">
        {error && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-base font-bold text-slate-900">{error}</p>
            <Link
              href="/venues"
              className="mt-4 inline-flex rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
            >
              Back to venues
            </Link>
          </div>
        )}

        {!error && !venue && (
          <p className="text-sm text-slate-500">Loading venue…</p>
        )}

        {!error && venue && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Image */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={venue.venueName}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-sm font-medium text-slate-400">
                  No photo
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  venue.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-600'
                    : venue.status === 'pending'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {venue.status}
              </span>

              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {venue.venueName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {venue.location.address ? `${venue.location.address}, ` : ''}
                {venue.location.city}
                {venue.location.state ? `, ${venue.location.state}` : ''}
              </p>

              {venue.description && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{venue.description}</p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Capacity
                  </div>
                  <div className="mt-1 text-xl font-extrabold text-slate-900">
                    {(venue.capacity ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Price / day
                  </div>
                  <div className="mt-1 text-xl font-extrabold text-amber-500">
                    ₹{(venue.pricePerDay ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/venues/${venue._id}/edit`}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99]"
                >
                  Edit Venue
                </Link>
                <Link
                  href="/venues"
                  className="rounded-xl border border-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                >
                  Back to Venues
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
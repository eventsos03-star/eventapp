'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api, ApiError } from '../../../lib/api'
import type { Venue, SafeUser, VenueSearchResult } from '../../../types'
import VenueHeader from '../../../components/venues/VenueHeader'
import VenueCard from '../../../components/venues/VenueCard'
import VenueMap from '../../../components/maps/VenueMap'

interface NearbyItem {
  venue: Venue
  distance?: number
}

function hasValidCoordinates(venue: Venue): boolean {
  const loc = venue.location
  if (!loc?.coordinates) return false
  const [lng, lat] = loc.coordinates
  return typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0)
}

function policyLabel(policy?: Venue['bookingPaymentPolicy'], advancePct?: number): string {
  if (!policy) return 'Booking policy not specified'
  switch (policy) {
    case 'fullpayment':
      return 'Full payment required at booking'
    case 'advanceAllowed':
      return advancePct ? `Advance payment allowed (${advancePct}% at booking)` : 'Advance payment allowed'
    case 'payAfterEvent':
      return 'Payment after event'
    default:
      return 'Booking policy not specified'
  }
}

function imagesOf(venue: Venue): string[] {
  return (venue.images ?? [])
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean) as string[]
}

export default function VenueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [user, setUser] = useState<SafeUser | null>(null)
  const [nearby, setNearby] = useState<NearbyItem[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // --------------------------------------------------
  // LOAD
  // --------------------------------------------------
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

        setVenue((venueResponse as { data: Venue }).data)
        setUser((userResponse as { data: SafeUser }).data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Could not load venue.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (id) loadData()

    return () => {
      cancelled = true
    }
  }, [id])

  // --------------------------------------------------
  // NEARBY VENUES
  // --------------------------------------------------
  const loadNearby = useCallback(async (v: Venue) => {
    if (!hasValidCoordinates(v)) return
    const [lng, lat] = v.location.coordinates
    setNearbyLoading(true)
    try {
      const { data } = await api.searchVenues({
        lat,
        lng,
        radius: 30000,
        limit: 4,
        page: 1,
      })
      const raw = Array.isArray(data) ? (data as Venue[]) : ((data as VenueSearchResult).venues ?? [])
      const nearbyList: NearbyItem[] = raw
        .filter((item) => item._id !== v._id)
        .map((item) => ({ venue: item, distance: item.distance }))
      setNearby(nearbyList)
    } catch {
      setNearby([])
    } finally {
      setNearbyLoading(false)
    }
  }, [])

  useEffect(() => {
    if (venue) {
      setActiveImage(0)
      loadNearby(venue)
    }
  }, [venue, loadNearby])

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------
  const handleDelete = async () => {
    if (!venue) return
    const confirmed = window.confirm('Are you sure you want to delete this venue?')
    if (!confirmed) return
    try {
      setDeleting(true)
      setError(null)
      await api.deleteVenue(venue._id)
      router.push('/venues')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete venue.')
    } finally {
      setDeleting(false)
    }
  }

  // --------------------------------------------------
  // STATES
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Loading venue…</p>
        </div>
      </div>
    )
  }

  if (error && !venue) {
    return <ErrorPage header={<VenueHeader backHref="/venues" />} message={error} />
  }

  if (!venue) {
    return <ErrorPage header={<VenueHeader backHref="/venues" />} message="Venue not found." />
  }

  // --------------------------------------------------
  // PERMISSIONS
  // --------------------------------------------------
  const venueOwnerId =
    typeof venue.ownerId === 'object' && venue.ownerId !== null
      ? String((venue.ownerId as { _id?: string })._id ?? venue.ownerId)
      : String(venue.ownerId)

  const currentUserId = user?.id ? String(user.id) : ''
  const isOwner = !!currentUserId && !!venueOwnerId && currentUserId === venueOwnerId
  const isAdmin = String(user?.role ?? '').trim().toLowerCase() === 'admin'
  const canEditVenue = !isAdmin && isOwner
  const canDeleteVenue = isAdmin || isOwner

  const images = imagesOf(venue)
  const coords = hasValidCoordinates(venue)
    ? { lat: venue.location.coordinates[1], lng: venue.location.coordinates[0] }
    : null

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <VenueHeader backHref="/venues" showAddVenue={!isAdmin && !isOwner} />

      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* --------------------------------------------------
          HERO: TITLE + IMAGE GALLERY
      -------------------------------------------------- */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Link href="/venues" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-amber-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Venues
          </Link>

          {/* GALLERY */}
          {images.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-[1fr,220px]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[activeImage]}
                  alt={venue.venueName}
                  className="h-[300px] w-full object-cover sm:h-[440px]"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 lg:grid-cols-1 lg:grid-rows-4">
                  {images.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`relative overflow-hidden rounded-xl border-2 transition ${
                        activeImage === i ? 'border-amber-500' : 'border-transparent hover:border-amber-300'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm text-slate-400">
              No photos available
            </div>
          )}

          {/* TITLE */}
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Venue</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {venue.venueName}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {[venue.location.formattedAddress || venue.location.address, venue.location.city, venue.location.state]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Price / day</p>
              <p className="text-3xl font-extrabold text-amber-600">
                ₹{venue.pricePerDay ? venue.pricePerDay.toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          BODY: INFO + MAP + NEARBY
      -------------------------------------------------- */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:col-span-2">
            {/* ABOUT */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">About this venue</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-600">
                {venue.description || 'No description provided.'}
              </p>
            </section>

            {/* HIGHLIGHTS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Capacity</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{(venue.capacity ?? 0).toLocaleString()}</p>
                <p className="mt-0.5 text-xs text-slate-500">Guests</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Price / day</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">₹{(venue.pricePerDay ?? 0).toLocaleString()}</p>
                <p className="mt-0.5 text-xs text-slate-500">Per day</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Booking</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{policyLabel(venue.bookingPaymentPolicy, venue.advancePercentage)}</p>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: LOCATION + ACTIONS */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-bold text-slate-900">Location</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                {venue.location.formattedAddress ||
                  [venue.location.address, venue.location.city, venue.location.state, venue.location.country, venue.location.postalCode]
                    .filter(Boolean)
                    .join(', ')}
              </p>

              <div className="mt-4">
                <VenueMap venue={venue} />
              </div>

              {coords && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Get Directions
                </a>
              )}
            </section>

            {/* OWNER / ADMIN ACTIONS */}
            {(canEditVenue || canDeleteVenue) && (
              <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-base font-bold text-slate-900">Manage venue</h2>
                {canEditVenue && (
                  <Link
                    href={`/venues/${venue._id}/edit`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Venue
                  </Link>
                )}
                {canDeleteVenue && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {deleting ? 'Deleting…' : 'Delete Venue'}
                  </button>
                )}
              </section>
            )}
          </div>
        </div>

        {/* --------------------------------------------------
            NEARBY VENUES
        -------------------------------------------------- */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Nearby venues</h2>
            {coords && (
              <Link href={`/venues?lat=${coords.lat}&lng=${coords.lng}&label=${encodeURIComponent(venue.location.city || venue.location.state || 'Around here')}`} className="text-sm font-semibold text-amber-600 hover:underline">
                View all nearby
              </Link>
            )}
          </div>

          {nearbyLoading ? (
            <div className="mt-4 flex items-center justify-center py-8 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="ml-2">Finding nearby venues…</span>
            </div>
          ) : nearby.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {nearby.map(({ venue: item, distance }) => (
                <VenueCard
                  key={item._id}
                  venue={item}
                  distanceMeters={distance ?? null}
                  onClick={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <p className="text-sm text-slate-500">No nearby venues found in this area.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function ErrorPage({ header, message }: { header: React.ReactNode; message: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {header}
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-10">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{message}</div>
      </main>
    </div>
  )
}

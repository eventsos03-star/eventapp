'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, ApiError } from '../../lib/api'
import type { Venue, VenueSearchResult } from '../../types'
import VenueHeader from '../../components/venues/VenueHeader'
import VenueCard from '../../components/venues/VenueCard'
import VenueFilters, { type VenueFiltersState } from '../../components/venues/VenueFilters'
import LocationSearch from '../../components/venues/LocationSearch'
import VenueClusterMap from '../../components/maps/VenueClusterMap'

type AuthState = 'checking' | 'authed' | 'guest'

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]
const DEFAULT_RADIUS = 25000

function normalizeVenues(data: Venue[] | VenueSearchResult | undefined | null): Venue[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.venues ?? []
}

function hasValidCoordinates(venue: Venue): boolean {
  const loc = venue.location
  if (!loc?.coordinates) return false
  const [lng, lat] = loc.coordinates
  return typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0)
}

export default function VenuePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm text-slate-500">Loading…</p></div>}>
      <VenuePageInner />
    </Suspense>
  )
}

function VenuePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authStatus, setAuthStatus] = useState<AuthState>('checking')
  const [user, setUser] = useState<any>(null)

  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [location, setLocation] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [filters, setFilters] = useState<VenueFiltersState>({ minCapacity: null, maxPrice: null })
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [showMyVenues, setShowMyVenues] = useState(false)

  const [totalPages, setTotalPages] = useState(1)
  const pageRef = useRef(1)

  const PAGE_SIZE = 12

  // Seed location from ?lat=&lng= (e.g. "View all nearby" / deep links)
  useEffect(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const label = searchParams.get('label')
    if (lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      setLocation({ lat: Number(lat), lng: Number(lng), label: label || 'Selected location' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --------------------------------------------------
  // AUTH
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
        if (!cancelled) setAuthStatus('guest')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (authStatus === 'guest') router.replace('/login')
  }, [authStatus, router])

  const isAdmin = useMemo(
    () => String(user?.role ?? '').trim().toLowerCase() === 'admin',
    [user]
  )

  // --------------------------------------------------
  // LOAD VENUES
  // --------------------------------------------------
  const loadVenues = useCallback(
    async (opts?: { append?: boolean }) => {
      if (authStatus !== 'authed') return
      const append = !!opts?.append
      const targetPage = append ? pageRef.current + 1 : 1

      if (append) setLoadMoreLoading(true)
      else setLoading(true)
      setError(null)

      try {
        if (showMyVenues) {
          const { data } = await api.getMyVenues()
          setVenues(Array.isArray(data) ? data : [])
          setTotalPages(1)
        } else if (location) {
          const { data } = await api.searchVenues({
            lat: location.lat,
            lng: location.lng,
            radius: DEFAULT_RADIUS,
            minCapacity: filters.minCapacity ?? undefined,
            maxPrice: filters.maxPrice ?? undefined,
            limit: PAGE_SIZE,
            page: targetPage,
          })
          if (Array.isArray(data)) {
            setVenues(append ? (prev) => [...prev, ...data] : data)
            setTotalPages(1)
          } else {
            const result = data as VenueSearchResult
            setVenues(append ? (prev) => [...prev, ...(result.venues ?? [])] : (result.venues ?? []))
            setTotalPages(result.totalPages ?? 1)
            pageRef.current = Array.isArray(data) ? 1 : targetPage
          }
        } else {
          const { data } = await api.searchVenues({
            minCapacity: filters.minCapacity ?? undefined,
            maxPrice: filters.maxPrice ?? undefined,
            limit: PAGE_SIZE,
            page: 1,
          })
          setVenues(normalizeVenues(data))
          setTotalPages(1)
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load venues.')
        if (!append) setVenues([])
      } finally {
        setLoading(false)
        setLoadMoreLoading(false)
      }
    },
    [authStatus, showMyVenues, location, filters]
  )

  useEffect(() => {
    pageRef.current = 1
    setTotalPages(1)
    loadVenues()
  }, [loadVenues])

  function handleLoadMore() {
    if (pageRef.current < totalPages) {
      loadVenues({ append: true })
    }
  }

  // Map center: focus on first selected or list center
  const mapCenter = useMemo<[number, number]>(() => {
    if (location) return [location.lat, location.lng]
    const first = venues.find(hasValidCoordinates)
    if (first) {
      const [lng, lat] = first.location.coordinates
      return [lat, lng]
    }
    return DEFAULT_CENTER
  }, [location, venues])

  const mapZoom = location ? 11 : 6

  const handleCardClick = useCallback((venue: Venue) => {
    setSelectedVenueId((prev) => (prev === venue._id ? prev : venue._id))
  }, [])

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  if (authStatus === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking your session…</p>
      </div>
    )
  }

  if (authStatus === 'guest') return null

  const resultsCount = venues.length

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <VenueHeader backHref="/dashboard" showAddVenue={!isAdmin} />

      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
            Venue Discovery
          </p>
          <h1 className="mt-2 max-w-2xl text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Find the perfect venue for your next event
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            Search approved venues by location, capacity, and budget — then explore them on the map.
          </p>

          {/* location search */}
          <div className="mt-6 max-w-xl">
            <LocationSearch value={location} onChange={setLocation} />
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-slate-900">Filters</span>
            <VenueFilters value={filters} onChange={setFilters} />
          </div>

          {!isAdmin && (
            <button
              type="button"
              onClick={() => {
                setShowMyVenues((p) => !p)
                setLocation(null)
                setSelectedVenueId(null)
              }}
              className={`rounded-lg border px-3.5 py-2 text-sm font-bold transition ${
                showMyVenues
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {showMyVenues ? '← All Venues' : 'My Venues'}
            </button>
          )}
        </div>
      </section>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        {/* results summary */}
        <div className="mb-3 flex items-center justify-between text-sm">
          <p className="font-medium text-slate-600">
            {showMyVenues
              ? 'Your venues'
              : `${resultsCount} venue${resultsCount === 1 ? '' : 's'} found${location ? ` near ${location.label}` : ''}`}
          </p>
          {!showMyVenues && location && (
            <button
              type="button"
              onClick={() => setLocation(null)}
              className="text-xs font-semibold text-amber-600 hover:underline"
            >
              Clear location
            </button>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* MOBILE: map on top */}
        <div className="mb-4 md:hidden">
          <MobileMap
            venues={venues}
            selectedVenueId={selectedVenueId}
            onVenueSelect={(v) => handleCardClick(v)}
            center={mapCenter}
            zoom={mapZoom}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          {/* LEFT: venue list */}
          <div className="lg:col-span-3">
            {loading && venues.length === 0 ? (
              <LoadingState />
            ) : venues.length === 0 && !loading && !error ? (
              <EmptyState
                isMyVenues={showMyVenues}
                hasLocation={!!location}
                hasFilters={filters.minCapacity !== null || filters.maxPrice !== null}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="space-y-2.5">
                {venues.map((venue) => (
                  <VenueCard
                    key={venue._id}
                    venue={venue}
                    active={selectedVenueId === venue._id}
                    distanceMeters={venue.distance ?? null}
                    onClick={handleCardClick}
                  />
                ))}
                {loading && venues.length > 0 && (
                  <div className="flex items-center justify-center py-4 text-sm text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    <span className="ml-2">Updating results…</span>
                  </div>
                )}

                {!showMyVenues && !!location && pageRef.current < totalPages && (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadMoreLoading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    {loadMoreLoading ? 'Loading more…' : 'Load more venues'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: map (desktop/tablet) */}
          <div className="hidden md:block lg:col-span-2">
            <div className="sticky top-20">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                  <p className="text-sm font-bold text-slate-900">Map</p>
                  <span className="text-xs text-slate-500">{resultsCount} on map</span>
                </div>
                <VenueClusterMap
                  venues={venues}
                  selectedVenueId={selectedVenueId}
                  onVenueSelect={(v) => handleCardClick(v)}
                  center={mapCenter}
                  zoom={mapZoom}
                  height={620}
                  mapId="venue-cluster-map-desktop"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function MobileMap({
  venues,
  selectedVenueId,
  onVenueSelect,
  center,
  zoom,
}: {
  venues: Venue[]
  selectedVenueId: string | null
  onVenueSelect: (v: Venue) => void
  center: [number, number]
  zoom: number
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="text-sm font-bold text-slate-900">Map</p>
        <span className="text-xs text-slate-500">{venues.length} on map</span>
      </div>
      <VenueClusterMap
        venues={venues}
        selectedVenueId={selectedVenueId}
        onVenueSelect={onVenueSelect}
        center={center}
        zoom={zoom}
        height={320}
        mapId="venue-cluster-map-mobile"
      />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      <p className="mt-3 text-sm font-medium text-slate-600">Loading venues…</p>
    </div>
  )
}

function EmptyState({
  isMyVenues,
  hasLocation,
  hasFilters,
  isAdmin,
}: {
  isMyVenues: boolean
  hasLocation: boolean
  hasFilters: boolean
  isAdmin: boolean
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p className="mt-3 text-base font-bold text-slate-900">
        {isMyVenues ? 'You have not added any venues yet' : 'No venues found'}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {isMyVenues
          ? 'Add your first venue to get started.'
          : hasLocation
            ? 'No venues found in this area. Try another location or increase the search radius.'
            : hasFilters
              ? 'No venues match your filters. Try widening capacity or price.'
              : 'There are no approved venues available yet.'}
      </p>
      {!isAdmin && !isMyVenues && (
        <a
          href="/venues/new"
          className="mt-4 inline-flex rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
        >
          + Add Venue
        </a>
      )}
    </div>
  )
}

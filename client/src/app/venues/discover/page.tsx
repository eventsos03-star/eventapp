'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { api, ApiError } from '../../../lib/api'
import type { Venue, GeocodingResult, VenueSearchResult } from '../../../types'
import VenueCard from '../../../components/venues/VenueCard'
import VenueFilters, { type VenueFiltersState } from '../../../components/venues/VenueFilters'
import VenueClusterMap from '../../../components/maps/VenueClusterMap'

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]

export default function VenueDiscoveryPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(5)
  const [filters, setFilters] = useState<VenueFiltersState>({ minCapacity: null, maxPrice: null })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchVenues = useCallback(
    async (p: number, geo: { lat?: number; lng?: number } | null, f: VenueFiltersState, append = false) => {
      setLoading(true)
      setError(null)
      try {
        const params: {
          lat?: number
          lng?: number
          radius?: number
          minCapacity?: number
          maxPrice?: number
          page: number
          limit: number
        } = {
          page: p,
          limit: 12,
        }
        if (geo) {
          params.lat = geo.lat
          params.lng = geo.lng
          params.radius = 50000
        }
        if (f.minCapacity) params.minCapacity = f.minCapacity
        if (f.maxPrice) params.maxPrice = f.maxPrice

        const { data } = await api.searchVenues(params)
        const result = data as VenueSearchResult
        if (Array.isArray(data)) {
          setVenues(data as unknown as Venue[])
          setTotal((data as unknown as Venue[]).length)
          setTotalPages(1)
        } else {
          setVenues((prev) => (append ? [...prev, ...(result.venues ?? [])] : result.venues ?? []))
          setTotal(result.total ?? 0)
          setTotalPages(result.totalPages ?? 1)
        }
      } catch (err) {
        if (!append) {
          setError(err instanceof ApiError ? err.message : 'Unable to load venues.')
          setVenues([])
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // initial load
  useEffect(() => {
    fetchVenues(1, null, { minCapacity: null, maxPrice: null })
  }, [fetchVenues])

  // preselected location from search
  const handleSelectLocation = useCallback(
    (result: GeocodingResult) => {
      setSelectedVenue(null)
      setMapCenter([result.latitude, result.longitude])
      setMapZoom(12)
      setSearchQuery(result.formattedAddress || `${result.city}, ${result.state}`)
      setShowResults(false)
      fetchVenues(1, { lat: result.latitude, lng: result.longitude }, filters)
    },
    [fetchVenues, filters]
  )

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim() || q.trim().length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true)
      api.searchLocations(q).then(({ data }) => {
        setSearchResults(data ?? [])
        setShowResults(true)
      }).catch(() => {
        setSearchResults([])
      }).finally(() => setSearching(false))
    }, 500)
  }, [])

  // click map marker
  const handleVenueSelect = useCallback((venue: Venue) => {
    setSelectedVenue(venue)
  }, [])

  const handleFiltersChange = useCallback(
    (f: VenueFiltersState) => {
      setFilters(f)
      const geo = selectedVenue?.location?.coordinates
      fetchVenues(1, geo ? { lat: geo[1], lng: geo[0] } : null, f)
    },
    [fetchVenues, selectedVenue]
  )

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    const geo = selectedVenue?.location?.coordinates
    void fetchVenues(next, geo ? { lat: geo[1], lng: geo[0] } : null, filters, true)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base shadow-md">E</div>
            <span className="text-lg font-bold tracking-tight text-slate-950">
              Event<span className="text-amber-500">OS</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold text-slate-600">
            <Link href="/venues" className="transition hover:text-amber-600">Venues</Link>
            <Link href="/venues/discover" className="text-amber-600">Discover</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Find the perfect venue
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Search by location, then filter and explore nearby venues on the map.
        </p>

        {/* Search Bar */}
        <div className="relative mt-5 max-w-2xl" ref={containerRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search venue or location..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          )}

          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {searchResults.map((r, i) => (
                <button
                  key={`${r.latitude}-${r.longitude}-${i}`}
                  type="button"
                  onClick={() => handleSelectLocation(r)}
                  className="w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-amber-50"
                >
                  <p className="truncate text-sm font-medium text-slate-900">
                    {r.address || `${r.city}, ${r.state}` || 'Unknown location'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {[r.city, r.state, r.country].filter(Boolean).join(', ')}
                  </p>
                </button>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && !searching && searchQuery.trim().length >= 3 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-lg">
              <p className="text-sm text-slate-500">No results found. Try a different search.</p>
            </div>
          )}
        </div>

        {/* Active location chip */}
        {selectedVenue && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm text-amber-800">
            <span>Showing venues near {selectedVenue.venueName}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedVenue(null)
                setSearchQuery('')
                setMapCenter(DEFAULT_CENTER)
                setMapZoom(5)
                fetchVenues(1, null, filters)
              }}
              className="text-amber-600 hover:text-amber-800"
            >
              &times;
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Mobile: map first */}
          <div className="order-1 lg:order-2 lg:col-span-2">
            <VenueClusterMap
              venues={venues}
              selectedVenueId={selectedVenue?._id ?? null}
              onVenueSelect={handleVenueSelect}
              center={mapCenter}
              zoom={mapZoom}
              className="h-full"
            />
          </div>

          {/* Filters + Results */}
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-1">
            {/* Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">Filters</h2>
              <VenueFilters value={filters} onChange={handleFiltersChange} />
            </div>

            {/* Results */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Venue Results</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {total} found
                </span>
              </div>

              {loading && venues.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm text-slate-500">Loading venues...</p>
                </div>
              ) : venues.length === 0 && !loading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">No venues found in this area.</p>
                  <p className="mt-1 text-xs text-slate-500">Try increasing your search radius or adjusting filters.</p>
                </div>
              ) : (
                <>
                  {venues.map((v) => (
                    <VenueCard
                      key={v._id}
                      venue={v}
                      active={selectedVenue?._id === v._id}
                      distanceMeters={v.distance ?? null}
                      onClick={() => setSelectedVenue(v)}
                    />
                  ))}
                  {page < totalPages && (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      {loading ? 'Loading...' : 'Load more'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

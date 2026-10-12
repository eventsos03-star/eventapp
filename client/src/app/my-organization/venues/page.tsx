'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Venue, VenueSearchResult, GeocodingResult } from '@/types'
import VenueClusterMap from '@/components/maps/VenueClusterMap'
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Building2,
  Users,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Plus,
  Compass,
  X,
  Layers,
  Heart,
  CalendarCheck,
  RotateCcw,
  Navigation,
  Check,
} from 'lucide-react'

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]
const DEFAULT_RADIUS = 25000
const PAGE_SIZE = 12

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'capacity-desc' | 'distance-asc'

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

function formatDistance(meters?: number | null): string | null {
  if (meters === undefined || meters === null || meters < 0) return null
  if (meters < 1000) return `${Math.round(meters)} m away`
  return `${(meters / 1000).toFixed(1)} km away`
}

export default function MyOrganizationVenuesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-sm">Loading venues...</span>
          </div>
        </div>
      }
    >
      <VenuesContent />
    </Suspense>
  )
}

function VenuesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, initializing } = useAuth()

  const orgRole = (user as any)?.orgRole || 'member'
  const isAdmin =
    String(user?.role ?? '').trim().toLowerCase() === 'admin' || orgRole === 'owner'

  // Venue state
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [location, setLocation] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<GeocodingResult[]>([])
  const [locationSearching, setLocationSearching] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const locationContainerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [minCapacity, setMinCapacity] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [showMyVenues, setShowMyVenues] = useState(false)
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

  const [totalPages, setTotalPages] = useState(1)
  const pageRef = useRef(1)

  // Initialize location from URL query if provided
  useEffect(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const label = searchParams.get('label')
    if (lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      const loc = { lat: Number(lat), lng: Number(lng), label: label || 'Selected Location' }
      setLocation(loc)
      setLocationQuery(loc.label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close location autocomplete when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(e.target as Node)
      ) {
        setLocationDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle location search input with debounce
  const handleLocationInputChange = (val: string) => {
    setLocationQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!val.trim()) {
      setLocationResults([])
      setLocationSearching(false)
      setLocationDropdownOpen(false)
      if (location !== null) {
        setLocation(null)
      }
      return
    }

    setLocationDropdownOpen(true)
    if (val.trim().length < 3) {
      setLocationResults([])
      setLocationSearching(false)
      return
    }

    setLocationSearching(true)
    debounceRef.current = setTimeout(() => {
      api
        .searchLocations(val)
        .then(({ data }) => {
          setLocationResults(data ?? [])
          setLocationDropdownOpen(true)
        })
        .catch(() => setLocationResults([]))
        .finally(() => setLocationSearching(false))
    }, 450)
  }

  const handleSelectLocation = (result: GeocodingResult) => {
    const label =
      result.formattedAddress ||
      [result.city, result.state, result.country].filter(Boolean).join(', ') ||
      'Selected location'
    const newLoc = { lat: result.latitude, lng: result.longitude, label }
    setLocation(newLoc)
    setLocationQuery(label)
    setLocationDropdownOpen(false)
  }

  const handleClearLocation = () => {
    setLocation(null)
    setLocationQuery('')
    setLocationResults([])
    setLocationDropdownOpen(false)
  }

  // Load venues from backend
  const loadVenues = useCallback(
    async (opts?: { append?: boolean }) => {
      if (initializing) return
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
          const parsedCap = minCapacity ? Number(minCapacity) : undefined
          const parsedPrice = maxPrice ? Number(maxPrice) : undefined

          const { data } = await api.searchVenues({
            lat: location.lat,
            lng: location.lng,
            radius: DEFAULT_RADIUS,
            minCapacity: parsedCap,
            maxPrice: parsedPrice,
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
          const parsedCap = minCapacity ? Number(minCapacity) : undefined
          const parsedPrice = maxPrice ? Number(maxPrice) : undefined

          const { data } = await api.searchVenues({
            minCapacity: parsedCap,
            maxPrice: parsedPrice,
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
    [initializing, showMyVenues, location, minCapacity, maxPrice]
  )

  useEffect(() => {
    pageRef.current = 1
    setTotalPages(1)
    loadVenues()
  }, [loadVenues])

  const handleLoadMore = () => {
    if (pageRef.current < totalPages) {
      loadVenues({ append: true })
    }
  }

  // Sort venues locally
  const sortedVenues = useMemo(() => {
    const list = [...venues]
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => (a.pricePerDay ?? 0) - (b.pricePerDay ?? 0))
      case 'price-desc':
        return list.sort((a, b) => (b.pricePerDay ?? 0) - (a.pricePerDay ?? 0))
      case 'capacity-desc':
        return list.sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0))
      case 'distance-asc':
        return list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      default:
        return list
    }
  }, [venues, sortBy])

  // Center coordinates for map
  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedVenueId) {
      const selected = venues.find((v) => v._id === selectedVenueId)
      if (selected && hasValidCoordinates(selected)) {
        const [lng, lat] = selected.location.coordinates
        return [lat, lng]
      }
    }
    if (location) return [location.lat, location.lng]
    const firstWithCoords = venues.find(hasValidCoordinates)
    if (firstWithCoords) {
      const [lng, lat] = firstWithCoords.location.coordinates
      return [lat, lng]
    }
    return DEFAULT_CENTER
  }, [selectedVenueId, location, venues])

  const mapZoom = location ? 11 : selectedVenueId ? 13 : 6

  const handleCardClick = useCallback((venue: Venue) => {
    setSelectedVenueId((prev) => (prev === venue._id ? null : venue._id))
  }, [])

  const toggleFavorite = (venueId: string) => {
    setFavorites((prev) => ({ ...prev, [venueId]: !prev[venueId] }))
  }

  // Summary Metrics
  const stats = useMemo(() => {
    const total = venues.length
    if (total === 0) {
      return { total: 0, minPrice: 0, maxPrice: 0, peakCapacity: 0 }
    }
    const prices = venues.map((v) => v.pricePerDay ?? 0).filter((p) => p > 0)
    const capacities = venues.map((v) => v.capacity ?? 0).filter((c) => c > 0)
    return {
      total,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      peakCapacity: capacities.length ? Math.max(...capacities) : 0,
    }
  }, [venues])

  const hasActiveFilters = Boolean(
    location !== null || minCapacity !== '' || maxPrice !== '' || sortBy !== 'default'
  )

  const handleResetFilters = () => {
    setLocation(null)
    setLocationQuery('')
    setMinCapacity('')
    setMaxPrice('')
    setSortBy('default')
  }

  return (
    <div className="relative w-full space-y-8">
      {/* Ambient background glow elements */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-96 -left-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-emerald-500/10 blur-[130px]" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-amber-400 font-black text-sm shadow-md border border-white/10">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Event<span className="text-amber-500">OS</span> · Venues
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Venue Directory & Spaces
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
            Browse and reserve verified event venues for your organization&apos;s upcoming events, or manage spaces your organization owns.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center rounded-xl border border-white/10 bg-[#0d1220] p-1">
            <button
              type="button"
              onClick={() => {
                setShowMyVenues(false)
                setSelectedVenueId(null)
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                !showMyVenues
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              All Venues
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMyVenues(true)
                setSelectedVenueId(null)
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                showMyVenues
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              My Venues
            </button>
          </div>

          <Link
            href="/venues/new"
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
          >
            <Plus className="h-3.5 w-3.5" />
            List Venue
          </Link>

          {!isAdmin && (
            <Link
              href="/venue-owner"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              Owner Portal
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>{showMyVenues ? 'My Listed Venues' : 'Spaces Available'}</span>
            <Building2 className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-white">{stats.total}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {showMyVenues ? 'Properties in your portfolio' : 'Verified & ready to host'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Location Filter</span>
            <MapPin className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-base sm:text-lg font-bold text-white truncate">
            {location ? location.label.split(',')[0] : 'All Regions'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400 truncate">
            {location ? `${location.label}` : 'Broad geographic search'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Starting Price</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-white">
            {stats.minPrice > 0 ? `₹${stats.minPrice.toLocaleString()}` : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {stats.maxPrice > 0 ? `Up to ₹${stats.maxPrice.toLocaleString()} / day` : 'Per day rates'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Peak Capacity</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-white">
            {stats.peakCapacity > 0 ? `${stats.peakCapacity.toLocaleString()}` : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">Largest attendee capacity</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative z-10 rounded-2xl border border-white/10 bg-[#111726]/90 p-5 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Location Autocomplete */}
          <div className="relative flex-1 min-w-[280px]" ref={locationContainerRef}>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Search by City or Landmark
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                onFocus={() => {
                  if (locationResults.length > 0 || locationQuery.trim().length >= 3) {
                    setLocationDropdownOpen(true)
                  }
                }}
                placeholder="Search city, neighborhood, or area..."
                className="w-full rounded-xl border border-white/10 bg-[#090d16] py-2.5 pl-10 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {locationSearching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                </div>
              )}
              {locationQuery && !locationSearching && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Clear location"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {locationDropdownOpen && locationResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0d1220] p-1.5 shadow-2xl backdrop-blur-xl divide-y divide-white/5">
                {locationResults.map((item, idx) => {
                  const label =
                    item.formattedAddress ||
                    [item.city, item.state, item.country].filter(Boolean).join(', ') ||
                    item.city
                  return (
                    <button
                      key={`${item.latitude}-${item.longitude}-${idx}`}
                      type="button"
                      onClick={() => handleSelectLocation(item)}
                      className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-white/5"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-white">
                          {label}
                        </span>
                        <span className="block truncate text-[11px] text-slate-400">
                          {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {locationDropdownOpen &&
              !locationSearching &&
              locationQuery.trim().length >= 3 &&
              locationResults.length === 0 && (
                <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-xl border border-white/10 bg-[#0d1220] p-4 text-center shadow-2xl">
                  <p className="text-xs text-slate-400">No matching locations found.</p>
                </div>
              )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32 sm:w-36">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Min Capacity
              </label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-xl border border-white/10 bg-[#090d16] py-2.5 pl-8 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="w-36 sm:w-40">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Max Price (₹/day)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full rounded-xl border border-white/10 bg-[#090d16] py-2.5 pl-7 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="w-40 sm:w-44">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Sort Results
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full rounded-xl border border-white/10 bg-[#090d16] py-2.5 px-3 text-xs sm:text-sm text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="default" className="bg-[#090d16]">Featured / Default</option>
                <option value="price-asc" className="bg-[#090d16]">Price: Low to High</option>
                <option value="price-desc" className="bg-[#090d16]">Price: High to Low</option>
                <option value="capacity-desc" className="bg-[#090d16]">Capacity: Largest</option>
                {location && <option value="distance-asc" className="bg-[#090d16]">Distance: Closest</option>}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                title="Reset all filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1">
            Quick Filters:
          </span>
          {[
            { label: '50+ Guests', cap: '50' },
            { label: '200+ Guests', cap: '200' },
            { label: '500+ Guests', cap: '500' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setMinCapacity(minCapacity === preset.cap ? '' : preset.cap)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                minCapacity === preset.cap
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {preset.label}
            </button>
          ))}

          {[
            { label: 'Under ₹25k', price: '25000' },
            { label: 'Under ₹50k', price: '50000' },
            { label: 'Under ₹1L', price: '100000' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setMaxPrice(maxPrice === preset.price ? '' : preset.price)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                maxPrice === preset.price
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Main Grid: Venue Cards (Left) + Interactive Map (Right) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Venues */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {showMyVenues
                ? `Showing ${sortedVenues.length} venue${sortedVenues.length === 1 ? '' : 's'} owned by you`
                : `${sortedVenues.length} venue${sortedVenues.length === 1 ? '' : 's'} discovered${
                    location ? ` near ${location.label}` : ''
                  }`}
            </p>
            {selectedVenueId && (
              <button
                type="button"
                onClick={() => setSelectedVenueId(null)}
                className="text-xs text-amber-400 hover:underline"
              >
                Clear map focus
              </button>
            )}
          </div>

          {loading && venues.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#111726]/80 p-16 text-center backdrop-blur-xl">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="mt-4 text-sm font-semibold text-white">Searching available spaces...</p>
              <p className="mt-1 text-xs text-slate-400">Loading verified venues and availability.</p>
            </div>
          ) : sortedVenues.length === 0 && !loading && !error ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#111726]/60 p-12 text-center backdrop-blur-xl">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-amber-400">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">
                {showMyVenues ? 'No venues added yet' : 'No matching venues found'}
              </h3>
              <p className="mx-auto mt-1.5 max-w-sm text-xs sm:text-sm text-slate-400">
                {showMyVenues
                  ? 'You have not listed any venues yet. You can list your first venue now to make it available for booking.'
                  : location
                  ? 'No approved venues located in this area. Try clearing the location or adjusting filters.'
                  : hasActiveFilters
                  ? 'No venues match your capacity and budget constraints. Try widening your filters.'
                  : 'There are currently no approved venues available.'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                  >
                    Clear Filters
                  </button>
                )}
                <Link
                  href="/venues/new"
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  + Add New Venue
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedVenues.map((venue) => {
                const isSelected = selectedVenueId === venue._id
                const cover = venue.images?.[0]?.url
                const isFav = Boolean(favorites[venue._id])
                const distanceText = formatDistance(venue.distance ?? null)

                return (
                  <div
                    key={venue._id}
                    onClick={() => handleCardClick(venue)}
                    className={`group relative flex flex-col sm:flex-row gap-4 rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-[#162035] ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                        : 'border-white/10 bg-[#111726]/85 hover:border-amber-500/40 hover:bg-[#131d33]'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-44 sm:h-auto sm:w-44 shrink-0 overflow-hidden rounded-xl bg-[#090d16]">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={venue.venueName}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full min-h-[120px] flex-col items-center justify-center text-slate-500 gap-1">
                          <Building2 className="h-6 w-6" />
                          <span className="text-[10px]">No photo</span>
                        </div>
                      )}

                      {/* Favorite button */}
                      <button
                        type="button"
                        aria-label="Toggle bookmark"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(venue._id)
                        }}
                        className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full backdrop-blur-md transition ${
                          isFav
                            ? 'bg-red-500 text-white'
                            : 'bg-black/50 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Heart className="h-3.5 w-3.5" fill={isFav ? 'currentColor' : 'none'} />
                      </button>

                      {isSelected && (
                        <div className="absolute left-2 bottom-2 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                          Selected on map
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-base font-bold text-white group-hover:text-amber-400 transition">
                            {venue.venueName}
                          </h3>
                        </div>

                        {/* Location */}
                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span>
                            {venue.location?.city || 'Location not set'}
                            {venue.location?.state ? `, ${venue.location.state}` : ''}
                          </span>
                        </p>

                        {venue.description && (
                          <p className="mt-2 line-clamp-2 text-xs text-slate-400 leading-relaxed">
                            {venue.description}
                          </p>
                        )}
                      </div>

                      {/* Badges / Metrics Row */}
                      <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {/* Capacity Badge */}
                          <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-slate-300">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold">
                              {venue.capacity ? `${venue.capacity.toLocaleString()} guests` : '—'}
                            </span>
                          </div>

                          {/* Price Badge */}
                          <div className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-400 font-bold">
                            <span>₹{venue.pricePerDay ? venue.pricePerDay.toLocaleString() : '—'}</span>
                            <span className="text-[10px] text-amber-400/80 font-normal">/ day</span>
                          </div>

                          {/* Distance Badge */}
                          {distanceText && (
                            <div className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                              <Navigation className="h-3 w-3" />
                              <span>{distanceText}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/venues/${venue._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                          >
                            Details
                            <ExternalLink className="h-3 w-3" />
                          </Link>

                          <Link
                            href="/my-organization/events/new"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 shadow-sm"
                          >
                            <CalendarCheck className="h-3 w-3" />
                            Use in Event
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Pagination / Load more */}
              {!showMyVenues && !!location && pageRef.current < totalPages && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadMoreLoading}
                  className="w-full rounded-2xl border border-white/10 bg-[#111726]/80 p-3 text-xs font-bold text-slate-300 transition hover:border-amber-500/40 hover:bg-[#131c30] hover:text-white disabled:opacity-50"
                >
                  {loadMoreLoading ? 'Loading more venues...' : 'Load More Venues'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Interactive Map */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 space-y-3">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111726] shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0d1220]">
                <div className="flex items-center gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded-md bg-amber-500/10 text-amber-400">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Interactive Venue Map
                  </span>
                </div>
                <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                  {venues.length} on map
                </span>
              </div>

              <VenueClusterMap
                venues={venues}
                selectedVenueId={selectedVenueId}
                onVenueSelect={handleCardClick}
                center={mapCenter}
                zoom={mapZoom}
                height={600}
                mapId="venue-cluster-map-org"
              />
            </div>

            {selectedVenueId && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between text-xs text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-amber-400" />
                  Venue highlighted on map
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedVenueId(null)}
                  className="font-bold underline hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

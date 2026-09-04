'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { GeocodingResult, VenueLocation } from '../../types'
import { api } from '../../lib/api'

interface LocationPickerProps {
  value: VenueLocation | null
  onChange: (location: VenueLocation) => void
  error?: string
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629] // India

function toGeocodingResult(value: VenueLocation): GeocodingResult | null {
  const coords = value?.coordinates
  if (!coords || (coords[0] === 0 && coords[1] === 0)) return null
  return {
    latitude: coords[1],
    longitude: coords[0],
    address: value.address,
    city: value.city,
    state: value.state,
    country: value.country,
    postalCode: value.postalCode,
    formattedAddress: value.formattedAddress,
  }
}

function toVenueLocation(result: GeocodingResult): VenueLocation {
  return {
    type: 'Point',
    coordinates: [result.longitude, result.latitude],
    address: result.address,
    city: result.city,
    state: result.state,
    country: result.country,
    postalCode: result.postalCode,
    formattedAddress: result.formattedAddress,
  }
}

export default function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(() =>
    value ? toGeocodingResult(value) : null
  )
  const [confirmed, setConfirmed] = useState(!!value?.coordinates && !(value.coordinates[0] === 0 && value.coordinates[1] === 0))
  const [previewOpen, setPreviewOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const center: [number, number] = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : DEFAULT_CENTER

  useEffect(() => {
    if (value?.coordinates && !(value.coordinates[0] === 0 && value.coordinates[1] === 0)) {
      const r = toGeocodingResult(value)
      if (r) {
        setSelectedLocation((prev) => (prev && prev.latitude === r.latitude && prev.longitude === r.longitude ? prev : r))
        setConfirmed(true)
        setQuery(value.formattedAddress || value.city || '')
      }
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchLocations = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 3) {
      setResults([])
      setShowResults(false)
      return
    }
    setSearching(true)
    try {
      const { data } = await api.searchLocations(q)
      setResults(data ?? [])
      setShowResults(true)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleQueryChange = useCallback(
    (val: string) => {
      setQuery(val)
      setConfirmed(false)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        searchLocations(val)
      }, 500)
    },
    [searchLocations]
  )

  const selectResult = useCallback(
    (result: GeocodingResult) => {
      setSelectedLocation(result)
      setQuery(result.formattedAddress || `${result.city}, ${result.state}`)
      setShowResults(false)
      setConfirmed(true)
      onChange(toVenueLocation(result))
    },
    [onChange]
  )

  const handleMarkerDragEnd = useCallback(
    async (lat: number, lng: number) => {
      try {
        const { data } = await api.reverseLocation(lat, lng)
        const result = data
          ? {
              latitude: lat,
              longitude: lng,
              address: data.address,
              city: data.city,
              state: data.state,
              country: data.country,
              postalCode: data.postalCode,
              formattedAddress: data.formattedAddress,
            }
          : {
              latitude: lat,
              longitude: lng,
              address: '',
              city: '',
              state: '',
              country: '',
              postalCode: '',
              formattedAddress: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
            }
        setSelectedLocation(result)
        setQuery(result.formattedAddress || `${result.city}, ${result.state}`)
        setConfirmed(true)
        onChange(toVenueLocation(result))
      } catch {
        const result = {
          latitude: lat,
          longitude: lng,
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          formattedAddress: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
        }
        setSelectedLocation(result)
        setQuery(result.formattedAddress)
        setConfirmed(true)
        onChange(toVenueLocation(result))
      }
    },
    [onChange]
  )

  const clearSelection = useCallback(() => {
    setSelectedLocation(null)
    setQuery('')
    setResults([])
    setShowResults(false)
    setConfirmed(false)
    onChange({
      type: 'Point',
      coordinates: [0, 0],
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      formattedAddress: '',
    })
  }, [onChange])

  const applySelectedLocation = useCallback(() => {
    if (!selectedLocation) return
    setConfirmed(true)
    onChange(toVenueLocation(selectedLocation))
  }, [selectedLocation, onChange])

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

  const hasLocation = selectedLocation !== null

  return (
    <div className="space-y-3" ref={containerRef}>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        Venue Location *
      </label>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search for your venue address..."
          className={inputClass}
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        )}
        {query && !searching && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((result, i) => (
            <button
              key={`${result.latitude}-${result.longitude}-${i}`}
              type="button"
              onClick={() => selectResult(result)}
              className="w-full px-4 py-3 text-left transition hover:bg-amber-50 border-b border-slate-100 last:border-b-0"
            >
              <p className="text-sm font-medium text-slate-900 truncate">
                {result.address || result.city || 'Unknown location'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 truncate">
                {[result.city, result.state, result.country].filter(Boolean).join(', ')}
              </p>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !searching && query.length >= 3 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-lg">
          <p className="text-sm text-slate-500">No results found. Try a different search.</p>
        </div>
      )}

      {/* Map preview */}
      {hasLocation ? (
        <div className="space-y-3">
          <div className="relative">
            <LocationMap
              center={center}
              markerPosition={center}
              draggable={false}
              height={220}
            />
            <span className="absolute left-3 top-3 z-[1200] rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              Preview
            </span>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="absolute bottom-3 right-3 z-[1200] flex items-center gap-1.5 rounded-xl bg-slate-950/80 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur transition hover:bg-slate-950 pointer-events-auto"
            >
              <ExpandIcon />
              Preview map
            </button>
          </div>

          {/* Address display */}
          {selectedLocation?.formattedAddress && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Selected Location</p>
              <p className="mt-1 text-sm text-slate-900">{selectedLocation.formattedAddress}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                {selectedLocation.city && <span>{selectedLocation.city}</span>}
                {selectedLocation.state && <span>{selectedLocation.state}</span>}
                {selectedLocation.country && <span>{selectedLocation.country}</span>}
                {selectedLocation.postalCode && <span>{selectedLocation.postalCode}</span>}
              </div>
            </div>
          )}

          {!confirmed ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={applySelectedLocation}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
              >
                Confirm Location
              </button>
              <p className="text-xs text-slate-400">
                Use Preview to drag the pin, then confirm
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Location confirmed
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <svg className="mx-auto h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-2 text-sm text-slate-400">
            Search above to select a location
          </p>
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {/* Fullscreen preview overlay */}
      <FullscreenMap
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        center={center}
        markerPosition={center}
        onPick={handleMarkerDragEnd}
      />
    </div>
  )
}

/* ---------- small preview map ---------- */

function LocationMap({
  center,
  markerPosition,
  draggable,
  height = 300,
}: {
  center: [number, number]
  markerPosition: [number, number]
  draggable: boolean
  height?: number
}) {
  const [mounted, setMounted] = useState(false)
  const [MapParts, setMapParts] = useState<{
    MapContainer: typeof import('react-leaflet').MapContainer
    TileLayer: typeof import('react-leaflet').TileLayer
    Marker: typeof import('react-leaflet').Marker
  } | null>(null)

  useEffect(() => {
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, L]) => {
      // fix default icon
      // @ts-ignore
      delete L.default.Icon.Default.prototype._getIconUrl
      // @ts-ignore
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      setMapParts({ MapContainer: rl.MapContainer, TileLayer: rl.TileLayer, Marker: rl.Marker })
      setMounted(true)
    })
  }, [])

  if (!mounted || !MapParts) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-slate-100" style={{ height }}>
        <p className="text-sm text-slate-400">Loading map...</p>
      </div>
    )
  }

  const { MapContainer, TileLayer, Marker } = MapParts

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height, width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Marker position={markerPosition} draggable={draggable} />
      </MapContainer>
    </div>
  )
}

/* ---------- fullscreen preview overlay ---------- */

function FullscreenMap({
  open,
  onClose,
  center,
  markerPosition,
  onPick,
}: {
  open: boolean
  onClose: () => void
  center: [number, number]
  markerPosition: [number, number]
  onPick: (lat: number, lng: number) => void
}) {
  const [L, setL] = useState<any>(null)
  const [render, setRender] = useState(false)
  const [visible, setVisible] = useState(false)
  const containerIdRef = useRef(`fs-map-${Math.random().toString(36).slice(2, 8)}`)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const centerRef = useRef(center)
  const markerPosRef = useRef(markerPosition)

  centerRef.current = center
  markerPosRef.current = markerPosition

  // load leaflet once
  useEffect(() => {
    if (L) return
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([_rl, leaflet]) => {
      const l = leaflet.default
      // @ts-ignore — fix default marker icon
      delete l.Icon.Default.prototype._getIconUrl
      // @ts-ignore
      l.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      setL(l)
    })
  }, [L])

  // render/unrender + fade toggle
  useEffect(() => {
    if (!open) {
      setVisible(false)
      const t = setTimeout(() => setRender(false), 250)
      return () => clearTimeout(t)
    }
    setRender(true)
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    return () => cancelAnimationFrame(raf)
  }, [open])

  // create map when opened + leaflet ready
  useEffect(() => {
    if (!open || !L || !render) return
    const container = document.getElementById(containerIdRef.current)
    if (!container) return
    if (mapRef.current) return

    const map = L.map(container, {
      center: centerRef.current,
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
      updateWhenIdle: false,
      keepBuffer: 4,
    }).addTo(map)

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
    const marker = L.marker(markerPosRef.current, { icon, draggable: true })
    marker.on('dragend', () => {
      const p = marker.getLatLng()
      onPick(p.lat, p.lng)
    })
    marker.addTo(map)

    mapRef.current = map
    markerRef.current = marker

    return () => {
      marker.off()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [open, L, render, onPick])

  // invalidate size after the panel is fully visible so tiles render crisp
  useEffect(() => {
    if (!open || !mapRef.current) return
    let raf = requestAnimationFrame(() => {
      mapRef.current.invalidateSize()
      raf = requestAnimationFrame(() => mapRef.current?.invalidateSize())
    })
    return () => cancelAnimationFrame(raf)
  }, [open, visible, render])

  // lock scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!render) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 transition-opacity duration-250 sm:p-5 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Map preview"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-250 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-bold text-slate-900">Preview location</p>
            <p className="text-xs text-slate-500">Drag the pin to fine-tune. Location is selected automatically.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <CloseIcon />
          </button>
        </div>

        {/* map body */}
        <div className="relative flex-1 bg-slate-100">
          {!L ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-400">Loading map...</p>
            </div>
          ) : (
            <div id={containerIdRef.current} className="h-full w-full" />
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500">
            Tip: drop the pin anywhere on the map to select that exact spot.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- icons ---------- */

function ExpandIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M20 8V6a2 2 0 00-2-2h-2M4 16v2a2 2 0 002 2h2M20 16v2a2 2 0 01-2 2h-2" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

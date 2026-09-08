'use client'

import { useEffect, useState } from 'react'
import type { Venue } from '../../types'

interface VenueMapProps {
  venue: Venue
  className?: string
}

function hasValidCoordinates(venue: Venue): boolean {
  const loc = venue.location
  if (!loc?.coordinates) return false
  const [lng, lat] = loc.coordinates
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    (lat !== 0 || lng !== 0)
  )
}

export default function VenueMap({ venue, className = '' }: VenueMapProps) {
  const [mounted, setMounted] = useState(false)
  const [MapParts, setMapParts] = useState<any>(null)

  useEffect(() => {
    if (!hasValidCoordinates(venue)) return
    Promise.all([import('react-leaflet'), import('leaflet')]).then(
      ([rl, L]) => {
        // @ts-expect-error — leaflet icon fix for bundlers
        delete L.default.Icon.Default.prototype._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
        setMapParts({
          MapContainer: rl.MapContainer,
          TileLayer: rl.TileLayer,
          Marker: rl.Marker,
        })
        setMounted(true)
      },
    )
  }, [venue])

  if (!hasValidCoordinates(venue)) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 ${className}`}
        style={{ minHeight: 200 }}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-slate-400">
            Map not available for this venue
          </p>
        </div>
      </div>
    )
  }

  if (!mounted || !MapParts) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-slate-100 ${className}`}
        style={{ minHeight: 300 }}
      >
        <p className="text-sm text-slate-400">Loading map...</p>
      </div>
    )
  }

  const { MapContainer, TileLayer, Marker } = MapParts
  const [lng, lat] = venue.location.coordinates
  const center: [number, number] = [lat, lng]

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 ${className}`}
    >
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: 300, width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Marker position={center} />
      </MapContainer>
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
        Get Directions
      </a>
    </div>
  )
}

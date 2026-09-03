'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Venue } from '../../types'

interface VenueClusterMapProps {
  venues: Venue[]
  selectedVenueId: string | null
  onVenueSelect: (venue: Venue) => void
  center?: [number, number]
  zoom?: number
  className?: string
}

function hasValidCoordinates(venue: Venue): boolean {
  const loc = venue.location
  if (!loc?.coordinates) return false
  const [lng, lat] = loc.coordinates
  return typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0)
}

export default function VenueClusterMap({
  venues,
  selectedVenueId,
  onVenueSelect,
  center = [20.5937, 78.9629],
  zoom = 5,
  className = '',
}: VenueClusterMapProps) {
  const [mounted, setMounted] = useState(false)
  const [L, setL] = useState<any>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const clusterGroupRef = useRef<any>(null)

  useEffect(() => {
    Promise.all([import('react-leaflet'), import('leaflet'), import('leaflet.markercluster')]).then(
      ([_rl, leaflet, _cluster]) => {
        // @ts-ignore — leaflet icon fix
        delete leaflet.default.Icon.Default.prototype._getIconUrl
        // @ts-ignore
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
        setL(leaflet.default)
        setMounted(true)
      }
    )
  }, [])

  const createPopupContent = useCallback(
    (venue: Venue) => {
      const div = document.createElement('div')
      div.className = 'p-1 min-w-[180px]'
      div.innerHTML = `
        <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px">${venue.venueName}</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:4px">${venue.location?.city || ''}</div>
        <div style="display:flex;gap:8px;font-size:11px;color:#64748b;margin-bottom:6px">
          <span>${(venue.capacity ?? 0).toLocaleString()} capacity</span>
          <span>₹${(venue.pricePerDay ?? 0).toLocaleString()}/day</span>
        </div>
        <a href="/venues/${venue._id}" style="display:inline-block;padding:4px 10px;font-size:11px;font-weight:600;color:#92400e;background:#fef3c7;border-radius:6px;text-decoration:none">View Venue</a>
      `
      return div
    },
    []
  )

  useEffect(() => {
    if (!mounted || !L) return
    const map = L.map('venue-cluster-map', {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    return () => { map.remove() }
  }, [mounted, L, center, zoom])

  useEffect(() => {
    if (!mapRef.current || !L) return
    const map = mapRef.current
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current)
    }
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      chunkedLoading: true,
    })
    const validVenues = venues.filter(hasValidCoordinates)
    validVenues.forEach((venue) => {
      const [lng, lat] = venue.location.coordinates
      const marker = L.marker([lat, lng])
      marker.bindPopup(createPopupContent(venue))
      marker.on('click', () => onVenueSelect(venue))
      clusterGroup.addLayer(marker)
      markersRef.current.push({ id: venue._id, marker })
    })
    map.addLayer(clusterGroup)
    clusterGroupRef.current = clusterGroup
    if (validVenues.length > 0) {
      const bounds = L.latLngBounds(validVenues.map((v) => [v.location.coordinates[1], v.location.coordinates[0]]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [venues, L, createPopupContent, onVenueSelect])

  useEffect(() => {
    if (!mapRef.current || !L) return
    markersRef.current.forEach(({ id, marker }) => {
      if (id === selectedVenueId) {
        marker.openPopup()
        mapRef.current.setView(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 13))
      }
    })
  }, [selectedVenueId, L])

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-slate-100 ${className}`} style={{ minHeight: 400 }}>
        <p className="text-sm text-slate-400">Loading map...</p>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
      />
      <div id="venue-cluster-map" style={{ height: 500, width: '100%' }} />
    </div>
  )
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { MapContainerProps } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false })

function fixLeafletIcon() {
  if (typeof window === 'undefined') return
  // @ts-expect-error — Leaflet default icon fix for bundlers
  delete L.Icon.Default.prototype._getIconUrl
  // @ts-expect-error
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

interface DynamicMapProps extends Omit<MapContainerProps, 'children'> {
  className?: string
  loadingClassName?: string
  loadingText?: string
  children?: React.ReactNode
  onReady?: () => void
}

export default function DynamicMap({
  center,
  zoom = 13,
  className = '',
  loadingClassName = '',
  loadingText = 'Loading map...',
  children,
  onReady,
  ...rest
}: DynamicMapProps) {
  const [mounted, setMounted] = useState(false)
  const readyCalled = useRef(false)

  useEffect(() => {
    fixLeafletIcon()
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !readyCalled.current) {
      readyCalled.current = true
      onReady?.()
    }
  }, [mounted, onReady])

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 rounded-2xl ${loadingClassName}`}
        style={{ minHeight: 300 }}
      >
        <p className="text-sm text-slate-400">{loadingText}</p>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`rounded-2xl ${className}`}
      zoomControl={true}
      scrollWheelZoom={true}
      style={{ minHeight: 300 }}
      {...rest}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {children}
    </MapContainer>
  )
}

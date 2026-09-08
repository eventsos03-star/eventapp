'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Venue } from '../../types'

interface VenueCardProps {
  venue: Venue
  active?: boolean
  distanceMeters?: number | null
  showFavorite?: boolean
  onClick: (venue: Venue) => void
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

function formatDistance(meters?: number | null): string | null {
  if (meters === undefined || meters === null || meters < 0) return null
  if (meters < 1000) return `${Math.round(meters)} m away`
  return `${(meters / 1000).toFixed(1)} km away`
}

function LocationIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}

export default function VenueCard({
  venue,
  active,
  distanceMeters,
  showFavorite = true,
  onClick,
}: VenueCardProps) {
  const cover = venue.images?.[0]?.url
  const [favorite, setFavorite] = useState(false)
  const [showOnMap, setShowOnMap] = useState(false)
  const canShowOnMap = hasValidCoordinates(venue)
  const distance = formatDistance(distanceMeters)

  return (
    <div
      onClick={() => onClick(venue)}
      onMouseEnter={() => canShowOnMap && setShowOnMap(true)}
      onMouseLeave={() => canShowOnMap && setShowOnMap(false)}
      className={`group relative flex cursor-pointer gap-3 rounded-xl border bg-white p-2.5 transition ${
        active
          ? 'border-amber-500 ring-2 ring-amber-200'
          : 'border-slate-200 hover:border-amber-300 hover:shadow-sm'
      }`}
    >
      {/* Image */}
      <div className="relative w-[104px] shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-[120px]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={venue.venueName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-24 items-center justify-center text-[11px] text-slate-400">
            No photo
          </div>
        )}
        {showFavorite && (
          <button
            type="button"
            aria-label="Toggle favorite"
            onClick={(e) => {
              e.stopPropagation()
              setFavorite((v) => !v)
            }}
            className={`absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full transition ${
              favorite
                ? 'bg-red-50 text-red-500'
                : 'bg-white/85 text-slate-400 hover:text-red-500'
            }`}
          >
            <svg
              className="h-4 w-4"
              fill={favorite ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[15px] font-bold text-slate-900 group-hover:text-amber-600">
              {venue.venueName}
            </h3>
            <span
              className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-block ${active ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {showOnMap ? 'On map' : ''}
            </span>
          </div>

          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
            <LocationIcon />
            {venue.location?.city || 'Location not set'}
            {venue.location?.state ? `, ${venue.location.state}` : ''}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <UsersIcon />
            <span className="font-semibold text-slate-900">
              {venue.capacity ? venue.capacity.toLocaleString() : '—'}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              Per day
            </span>{' '}
            <span className="text-sm font-bold text-amber-600">
              ₹{venue.pricePerDay ? venue.pricePerDay.toLocaleString() : '—'}
            </span>
          </div>
        </div>

        {distance && (
          <p className="mt-1 text-[11px] font-medium text-emerald-600">
            {distance}
          </p>
        )}

        <Link
          href={`/venues/${venue._id}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1 self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
        >
          View Venue
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import type { Venue } from '../../types'

interface VenueCardProps {
  venue: Venue
  active?: boolean
  distanceMeters?: number | null
  onClick: (venue: Venue) => void
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

export default function VenueCard({ venue, active, distanceMeters, onClick }: VenueCardProps) {
  const cover = venue.images?.[0]?.url

  return (
    <div
      onClick={() => onClick(venue)}
      className={`group flex cursor-pointer gap-4 rounded-2xl border bg-white p-3 transition ${
        active
          ? 'border-amber-400 ring-2 ring-amber-200'
          : 'border-slate-200 hover:border-amber-300 hover:shadow-md'
      }`}
    >
      <div className="w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-32">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={venue.venueName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-28 items-center justify-center text-xs text-slate-400">
            No photo
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 sm:text-base">
            {venue.venueName}
          </h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {venue.location?.city || ''}
            {venue.location?.state ? `, ${venue.location.state}` : ''}
          </p>
          {distanceMeters !== undefined && distanceMeters !== null && (
            <p className="mt-0.5 text-xs font-medium text-emerald-600">
              {formatDistance(distanceMeters)}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Capacity</span>
            <span className="text-sm font-bold text-slate-900">
              {(venue.capacity ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Per day</span>
            <span className="text-sm font-bold text-amber-600">
              ₹{(venue.pricePerDay ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        <Link
          href={`/venues/${venue._id}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex self-start rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-600 transition hover:bg-amber-50"
        >
          View Venue &rarr;
        </Link>
      </div>
    </div>
  )
}

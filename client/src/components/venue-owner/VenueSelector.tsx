'use client'

import type { Venue } from '../../types'

export function VenueSelector({
  venues,
  value,
  onChange,
}: {
  venues: Venue[]
  value: string
  onChange: (venueId: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">VENUE</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
      >
        {venues.length === 0 && <option value="">No venues</option>}
        {venues.map((venue) => (
          <option key={venue._id} value={venue._id}>
            {venue.venueName}
          </option>
        ))}
      </select>
    </label>
  )
}
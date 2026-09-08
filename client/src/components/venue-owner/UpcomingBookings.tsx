'use client'

import { format, parseISO } from 'date-fns'
import type { VenueBooking } from '../../types'
import { requesterName } from './BookingDetailPanel'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-slate-100 text-slate-600',
  completed: 'bg-slate-100 text-slate-600',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export function UpcomingBookings({
  bookings,
  venueName,
  onView,
  onApprove,
  onReject,
  busy,
}: {
  bookings: VenueBooking[]
  venueName: string
  onView: (booking: VenueBooking) => void
  onApprove?: (booking: VenueBooking) => void
  onReject?: (booking: VenueBooking) => void
  busy?: { [id: string]: 'approve' | 'reject' }
}) {
  const ordered = [...bookings].sort(
    (a, b) => +new Date(a.startDate) - +new Date(b.startDate),
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            Upcoming bookings
          </h2>
          <p className="text-sm text-slate-500">
            {venueName || 'Select a venue'}
          </p>
        </div>
      </div>

      {ordered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          No bookings for this venue yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((booking) => {
            const dateLabel =
              format(parseISO(booking.startDate), 'MMM d') +
              (booking.endDate && booking.endDate !== booking.startDate
                ? ` – ${format(parseISO(booking.endDate), 'MMM d')}`
                : '')
            const isBusy = busy?.[booking._id]
            return (
              <li
                key={booking._id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {dateLabel}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[booking.status]}`}
                    >
                      {STATUS_LABEL[booking.status] ?? booking.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {requesterName(booking)} · $
                    {booking.bookingAmount.toLocaleString()}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {booking.status === 'pending' && onApprove && (
                    <button
                      type="button"
                      onClick={() => onApprove(booking)}
                      disabled={Boolean(isBusy)}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy === 'approve' ? 'Saving…' : 'Approve'}
                    </button>
                  )}
                  {booking.status === 'pending' && onReject && (
                    <button
                      type="button"
                      onClick={() => onReject(booking)}
                      disabled={Boolean(isBusy)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy === 'reject' ? 'Saving…' : 'Reject'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onView(booking)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    View details
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

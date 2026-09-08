'use client'

import { format, parseISO } from 'date-fns'
import type { VenueBooking } from '../../types'
import { Spinner } from '../Spinner'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-slate-100 text-slate-600',
  completed: 'bg-slate-100 text-slate-600',
}

export function requesterName(booking: VenueBooking): string {
  const r = booking.requestedBy
  if (typeof r === 'string') return 'Organization member'
  return r ? `${r.firstName} ${r.lastName}` : 'Organization member'
}

export function BookingDetailPanel({
  booking,
  venueName,
  onClose,
  onApprove,
  onReject,
  busy,
}: {
  booking: VenueBooking
  venueName: string
  onClose: () => void
  onApprove?: () => void
  onReject?: () => void
  busy?: 'approve' | 'reject' | null
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Booking detail
            </p>
            <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{venueName}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <span className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[booking.status]}`}>
          {STATUS_LABEL[booking.status] ?? booking.status}
        </span>

        <dl className="mt-4 flex flex-col gap-3">
          <Row label="Requested by">{requesterName(booking)}</Row>
          <Row label="Start date">{format(parseISO(booking.startDate), 'EEE, MMM d yyyy')}</Row>
          <Row label="End date">{format(parseISO(booking.endDate), 'EEE, MMM d yyyy')}</Row>
          <Row label="Amount">${booking.bookingAmount.toLocaleString()}</Row>
          <Row label="Payment">{booking.paymentStatus.replace('Paid', ' Paid')}</Row>
        </dl>

        {(onApprove || onReject) && booking.status === 'pending' && (
          <div className="mt-6 flex gap-3">
            {onApprove && (
              <button
                type="button"
                onClick={onApprove}
                disabled={Boolean(busy)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === 'approve' && <Spinner size={16} />}
                Approve
              </button>
            )}
            {onReject && (
              <button
                type="button"
                onClick={onReject}
                disabled={Boolean(busy)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === 'reject' && <Spinner size={16} />}
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{children}</dd>
    </div>
  )
}
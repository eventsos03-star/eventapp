'use client'

import { useCallback, useEffect, useState } from 'react'
import { Spinner } from '../../../components/Spinner'
import { adminApi } from '../../../lib/adminApi'
import type { AdminBooking } from '../../../types'
import { PAYMENT_STYLES, type Message } from '../../../components/admin/ui'
import { ConfirmDialog } from '../../../components/admin/modals'

const STATUS_TABS: { value: AdminBooking['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

const STATUS_STYLES: Record<AdminBooking['status'], string> = {
  pending: 'bg-amber/20 text-amber-deep',
  approved: 'bg-teal/15 text-teal',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-ink-soft text-ink/60',
  completed: 'bg-teal/15 text-teal',
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [tab, setTab] = useState<AdminBooking['status'] | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<AdminBooking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchBookings = useCallback(async () => {
    const { data } = await adminApi.getBookings(tab === 'all' ? undefined : tab)
    setBookings(data ?? [])
  }, [tab])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await fetchBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load bookings')
    } finally {
      setLoading(false)
    }
  }, [fetchBookings])

  useEffect(() => {
    void load()
  }, [tab, load])

  function openCancel(booking: AdminBooking) {
    setCancelTarget(booking)
    setCancelOpen(true)
  }

  async function handleCancel() {
    if (!cancelTarget || cancelling) return
    setCancelling(true)
    setMessage(null)
    try {
      await adminApi.cancelBooking(cancelTarget.id)
      setMessage({ type: 'success', text: 'Booking cancelled successfully' })
      setCancelOpen(false)
      setCancelTarget(null)
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Cancel failed' })
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = (b: AdminBooking) =>
    (b.status === 'pending' || b.status === 'approved') && new Date(b.startDate) > new Date()

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper-dim">Bookings</h1>
          <p className="mt-2 text-paper-dim/55">View all venue bookings across the platform.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-paper-dim bg-ink-soft p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                tab === t.value
                  ? 'bg-amber text-ink'
                  : 'text-paper-dim/60 hover:text-paper-dim'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${message.type === 'success' ? 'border-teal/30 bg-teal/10 text-teal' : 'border-red-300 bg-red-50 text-red-700'}`}>{message.text}</div>
      )}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-16 text-paper-dim/55">
          <Spinner size={24} />
          <span className="text-sm">Loading bookings…</span>
        </div>
      ) : (
        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          {bookings.length === 0 ? (
            <p className="text-sm text-ink/45">No {tab === 'all' ? '' : `${tab} `}bookings found.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {bookings.map((booking) => {
                const venue =
                  booking.venueId && typeof booking.venueId === 'object' ? booking.venueId : null
                const org =
                  booking.organizationId && typeof booking.organizationId === 'object'
                    ? booking.organizationId
                    : null
                const requester =
                  booking.requestedBy && typeof booking.requestedBy === 'object'
                    ? booking.requestedBy
                    : null
                return (
                  <li key={booking.id} className="flex items-start justify-between gap-4 rounded-lg border border-paper-dim px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{venue?.venueName ?? 'Unknown venue'}</span>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[booking.status]}`}>
                          {booking.status}
                        </span>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STYLES[booking.paymentStatus] ?? 'bg-paper-dim text-ink/60'}`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink/45">
                        Org: {org?.organizationName ?? '—'} · Requested by: {requester ? `${requester.firstName} ${requester.lastName}` : '—'} · {requester?.email ?? ''}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/45">
                        {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()} · ${booking.bookingAmount}
                      </p>
                      {booking.cancellationReason && (
                        <p className="mt-1 text-xs text-ink/45">Cancel reason: {booking.cancellationReason}</p>
                      )}
                      <p className="mt-0.5 text-xs text-ink/35">Created {new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    {canCancel(booking) && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={cancelling}
                          onClick={() => openCancel(booking)}
                          className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel booking"
        message={`Cancel the booking for ${cancelTarget?.venueId && typeof cancelTarget.venueId === 'object' ? cancelTarget.venueId.venueName : 'this venue'}? This cannot be undone.`}
        confirmLabel="Cancel booking"
        tone="red"
        onConfirm={handleCancel}
        onCancel={() => { setCancelOpen(false); setCancelTarget(null) }}
        loading={cancelling}
      />
    </div>
  )
}
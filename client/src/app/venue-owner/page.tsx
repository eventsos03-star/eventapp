'use client'

import { useEffect, useMemo, useState } from 'react'
import { VenueOwnerRoute } from '../../components/VenueOwnerRoute'
import { Sidebar } from '../../components/venue-owner/Sidebar'
import type { OwnerTab } from '../../components/venue-owner/Sidebar'
import { StatCard } from '../../components/venue-owner/StatCard'
import { VenueSelector } from '../../components/venue-owner/VenueSelector'
import { AvailabilityCalendar } from '../../components/venue-owner/AvailabilityCalendar'
import { UpcomingBookings } from '../../components/venue-owner/UpcomingBookings'
import { BookingDetailPanel } from '../../components/venue-owner/BookingDetailPanel'
import { api } from '../../lib/api'
import type { DayCell } from '../../lib/calendar'
import type { Venue, VenueBooking } from '../../types'
import { isAfter, startOfDay, parseISO } from 'date-fns'

type BusyAction = { [id: string]: 'approve' | 'reject' }

function OwnerContent() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [bookings, setBookings] = useState<VenueBooking[]>([])
  const [tab, setTab] = useState<OwnerTab>('dashboard')
  const [loadingVenues, setLoadingVenues] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<VenueBooking | null>(null)
  const [busy, setBusy] = useState<BusyAction>({})
  const [menuOpen, setMenuOpen] = useState(false)

  const selectedVenue = useMemo(
    () => venues.find((v) => v._id === selectedVenueId) ?? null,
    [venues, selectedVenueId],
  )

  useEffect(() => {
    let active = true
    api
      .getMyVenues()
      .then(({ data }) => {
        if (!active) return
        setVenues(data ?? [])
        if ((data ?? []).length > 0)
          setSelectedVenueId((prev) => prev || data![0]._id)
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Could not load your venues',
          )
      })
      .finally(() => {
        if (active) setLoadingVenues(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!selectedVenueId) return
    setLoadingBookings(true)
    setError(null)
    api
      .getVenueBookings(selectedVenueId)
      .then(({ data }) => {
        if (active) setBookings(data ?? [])
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Could not load bookings',
          )
      })
      .finally(() => {
        if (active) setLoadingBookings(false)
      })
    return () => {
      active = false
    }
  }, [selectedVenueId])

  const venueChanged = (venueId: string) => {
    setSelectedVenueId(venueId)
    setDetail(null)
  }

  async function handleApprove(booking: VenueBooking) {
    setBusy((prev) => ({ ...prev, [booking._id]: 'approve' }))
    try {
      const { data } = await api.approveVenueBooking(booking._id)
      if (data) {
        setBookings((prev) => prev.map((b) => (b._id === data._id ? data : b)))
        setDetail((prev) => (prev?._id === data._id ? data : prev))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve booking')
    } finally {
      setBusy((prev) => {
        const next = { ...prev }
        delete next[booking._id]
        return next
      })
    }
  }

  async function handleReject(booking: VenueBooking) {
    setBusy((prev) => ({ ...prev, [booking._id]: 'reject' }))
    try {
      const { data } = await api.rejectVenueBooking(booking._id)
      if (data) {
        setBookings((prev) => prev.map((b) => (b._id === data._id ? data : b)))
        setDetail((prev) => (prev?._id === data._id ? data : prev))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reject booking')
    } finally {
      setBusy((prev) => {
        const next = { ...prev }
        delete next[booking._id]
        return next
      })
    }
  }

  const stats = useMemo(
    () => ({
      totalVenues: venues.length,
      upcoming: bookings.filter((b) => {
        const today = startOfDay(new Date())
        return (
          (b.status === 'approved' || b.status === 'pending') &&
          isAfter(parseISO(b.endDate), today)
        )
      }).length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      confirmed: bookings.filter((b) => b.status === 'approved').length,
    }),
    [venues, bookings],
  )

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-sm font-black text-amber-400">
            E
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Event<span className="text-amber-500">OS</span>
          </span>
        </div>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 lg:block">
          <Sidebar active={tab} onSelect={setTab} />
        </aside>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/60"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-64">
              <Sidebar
                active={tab}
                onSelect={(next) => {
                  setTab(next)
                  setMenuOpen(false)
                }}
                onClose={() => setMenuOpen(false)}
              />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Venue Owner
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage your venues, availability and booking requests.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <VenueSelector
                  venues={venues}
                  value={selectedVenueId}
                  onChange={venueChanged}
                />
              </div>
            </header>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            {tab === 'dashboard' && (
              <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total Venues" value={stats.totalVenues} />
                <StatCard label="Upcoming" value={stats.upcoming} />
                <StatCard
                  label="Pending requests"
                  value={stats.pending}
                  accent="amber"
                />
                <StatCard label="Confirmed" value={stats.confirmed} />
              </section>
            )}

            {tab === 'venues' && (
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-lg font-extrabold tracking-tight text-slate-900">
                  My Venues
                </h2>
                {loadingVenues ? (
                  <p className="text-sm text-slate-500">Loading venues…</p>
                ) : venues.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    You don&apos;t own any venues yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {venues.map((venue) => (
                      <li
                        key={venue._id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {venue.venueName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {venue.location.city} · {venue.capacity} capacity ·
                            ${venue.pricePerDay}/day
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            venue.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {venue.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === 'availability' && (
              <div className="relative">
                <AvailabilityCalendar
                  bookings={bookings}
                  venueName={selectedVenue?.venueName ?? ''}
                  onSelectDay={(cell: DayCell) => {
                    if (cell.booking) setDetail(cell.booking)
                  }}
                />
                {loadingBookings && !selectedVenueId && (
                  <p className="mt-3 text-xs text-slate-500">
                    Select a venue to see availability.
                  </p>
                )}
              </div>
            )}

            {tab === 'bookings' && (
              <UpcomingBookings
                bookings={bookings}
                venueName={selectedVenue?.venueName ?? ''}
                onView={(b) => setDetail(b)}
                onApprove={handleApprove}
                onReject={handleReject}
                busy={busy}
              />
            )}

            {tab === 'settings' && (
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-2 text-lg font-extrabold tracking-tight text-slate-900">
                  Settings
                </h2>
                <p className="text-sm text-slate-500">
                  Venue owner settings (pricing, maintenance blackouts,
                  notifications) are coming soon.
                </p>
              </section>
            )}
          </div>
        </main>
      </div>

      {detail && (
        <BookingDetailPanel
          booking={detail}
          venueName={selectedVenue?.venueName ?? 'Venue'}
          onClose={() => setDetail(null)}
          onApprove={
            detail.status === 'pending'
              ? () => handleApprove(detail)
              : undefined
          }
          onReject={
            detail.status === 'pending' ? () => handleReject(detail) : undefined
          }
          busy={detail && busy[detail._id]}
        />
      )}
    </div>
  )
}

export default function VenueOwnerPage() {
  return (
    <VenueOwnerRoute>
      <OwnerContent />
    </VenueOwnerRoute>
  )
}

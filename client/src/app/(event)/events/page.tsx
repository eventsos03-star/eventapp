'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { eventService } from '@/lib/eventApi'
import { useAuth } from '@/context/AuthContext' // adjust path to your actual auth context

export default function EventsListPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const hasOrganization = Boolean(user?.organizationId)

  useEffect(() => {
    let cancelled = false

    eventService
      .list()
      .then((res) => {
        if (!cancelled) {
          setEvents(res.data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? 'Failed to load events')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#090d16] text-white font-sans antialiased p-5 sm:p-10 lg:p-12">
      {/* Background Glow Accents */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-amber-400 font-black text-sm shadow-md border border-white/10">
                E
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Event<span className="text-amber-500">OS</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Upcoming{' '}
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                Live Events
              </span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Explore scheduled venues, secure entry passes, and track live
              command schedules.
            </p>
          </div>

          {hasOrganization && (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Link
                href="/my-organization"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm"
              >
                My organization
              </Link>
              {/* <Link
                href={`/events/new?orgId=${user!.organizationId}`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
              >
                + Create Event
              </Link> */}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-white/5 bg-[#111726]/40 p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-6 bg-slate-800 rounded w-2/3" />
                </div>
                <div className="h-10 bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center backdrop-blur-xl">
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-12 text-center backdrop-blur-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 mb-4">
              ⚡ Command Center Empty
            </span>
            <h3 className="text-xl font-bold text-white">
              No published events found
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              There are currently no active live experiences. Check back later
              or publish a new event.
            </p>
          </div>
        )}

        {/* Event List Grid */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => {
              const isPaid = event.eventType === 'paid'

              return (
                <div
                  key={event._id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#111726]/80 p-5 sm:p-6 backdrop-blur-xl transition duration-300 hover:border-amber-500/40 hover:bg-[#111726]"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {new Date(event.eventDate).toLocaleDateString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          },
                        )}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                          isPaid
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {isPaid
                          ? `$${event.ticketPrice || '0'} Ticket`
                          : 'Free Entry'}
                      </span>
                    </div>

                    {/* Event Title */}
                    <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-400 transition">
                      {event.eventName}
                    </h2>

                    {/* Event Description Snippet */}
                    {event.description && (
                      <p className="mt-2 text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Card Bottom CTA Actions */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400">
                      Cap:{' '}
                      <span className="font-semibold text-slate-200">
                        {event.maxParticipants} max
                      </span>
                    </div>

                    <Link
                      href={`/events/${event._id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.98]"
                    >
                      {isPaid ? 'Buy Tickets' : 'Register Now'} &rarr;
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

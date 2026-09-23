'use client'

import { useCallback, useEffect, useState } from 'react'
import { Spinner } from '../../../components/Spinner'
import { adminApi } from '../../../lib/adminApi'
import type { AdminReportCounts } from '../../../types'
import type { Message } from '../../../components/admin/ui'

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-paper px-4 py-2.5">
      <span className="text-sm text-ink/60">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  )
}

export default function AdminReportsPage() {
  const [counts, setCounts] = useState<AdminReportCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await adminApi.getReportCounts()
      setCounts(data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load report counts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper-dim">Reports</h1>
          <p className="mt-2 text-paper-dim/55">Platform-wide counts by resource.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-2 rounded-lg border border-paper-dim bg-ink-soft px-4 py-2 text-xs font-semibold text-paper-dim transition hover:bg-ink-line"
        >
          Refresh
        </button>
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

      {loading || !counts ? (
        <div className="flex items-center gap-3 py-16 text-paper-dim/55">
          <Spinner size={24} />
          <span className="text-sm">Loading reports…</span>
        </div>
      ) : (
        <div className="grid max-w-3xl gap-6 lg:grid-cols-2">
          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 left-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Events</h2>
            <div className="flex flex-col gap-2">
              <StatRow label="Total events" value={counts.totalEvents} />
              <StatRow label="Published events" value={counts.publishedEvents} />
            </div>
          </section>

          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 left-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Venues</h2>
            <div className="flex flex-col gap-2">
              <StatRow label="Total venues" value={counts.totalVenues} />
              <StatRow label="Approved venues" value={counts.approvedVenues} />
              <StatRow label="Pending venues" value={counts.pendingVenues} />
            </div>
          </section>

          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 left-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Bookings</h2>
            <div className="flex flex-col gap-2">
              <StatRow label="Total bookings" value={counts.totalBookings} />
              <StatRow label="Pending bookings" value={counts.pendingBookings} />
              <StatRow label="Approved bookings" value={counts.approvedBookings} />
              <StatRow label="Cancelled bookings" value={counts.cancelledBookings} />
              <StatRow label="Completed bookings" value={counts.completedBookings} />
            </div>
          </section>

          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 left-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Organizations</h2>
            <div className="flex flex-col gap-2">
              <StatRow label="Total organizations" value={counts.totalOrganizations} />
              <StatRow label="Approved organizations" value={counts.approvedOrganizations} />
            </div>
          </section>

          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 left-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Users</h2>
            <div className="flex flex-col gap-2">
              <StatRow label="Total users" value={counts.totalUsers} />
              <StatRow label="Admins" value={counts.totalAdmins} />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, CalendarDays, ClipboardList, MapPin, Store, Users, BarChart3 } from 'lucide-react'
import { Spinner } from '../../components/Spinner'
import { adminApi } from '../../lib/adminApi'
import type { AdminStats } from '../../types'
import { StatCard } from '../../components/admin/ui'

const QUICK_LINKS = [
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'Venue Owners', href: '/admin/venue-owners', icon: Store },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Events', href: '/admin/events', icon: CalendarDays },
  { label: 'Venues', href: '/admin/venues', icon: MapPin },
  { label: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await adminApi.getStats()
        if (!cancelled) setStats(data ?? null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load admin stats')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-paper-dim sm:text-4xl">Admin Dashboard</h1>
        <p className="mt-2 text-paper-dim/55">Review and manage organizations, venue owners, users, venues, bookings, and events.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-16 text-paper-dim/55">
          <Spinner size={24} />
          <span className="text-sm">Loading stats…</span>
        </div>
      ) : (
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total organizations" value={stats?.totalOrganizations ?? null} />
          <StatCard label="Pending organizations" value={stats?.pendingOrganizations ?? null} />
          <StatCard label="Total venue owners" value={stats?.totalVenueOwners ?? null} />
          <StatCard label="Pending venue owners" value={stats?.pendingVenueOwners ?? null} />
          <StatCard label="Total users" value={stats?.totalUsers ?? null} />
        </section>
      )}

      <h2 className="mb-4 font-display text-xl font-semibold text-paper-dim">Manage</h2>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-2xl border border-paper-dim bg-paper px-5 py-4 transition hover:bg-amber/10"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-amber">
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-display text-base font-semibold text-ink transition group-hover:text-amber-deep">
              {label}
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
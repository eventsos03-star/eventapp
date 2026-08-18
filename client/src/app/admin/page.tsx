'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminRoute } from '../../components/AdminRoute'
import { useAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/adminApi'
import type { AdminStats, Organization, ResourceStatus, VenueOwner } from '../../types'

type Message = { type: 'success' | 'error'; text: string } | null
type ActionTarget = { kind: 'organization' | 'venue-owner'; id: string; action: 'approve' | 'reject' }

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
  )
}

function Alert({ message }: { message: Message }) {
  if (!message) return null
  const isSuccess = message.type === 'success'
  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${
        isSuccess
          ? 'border-teal/30 bg-teal/10 text-teal'
          : 'border-red-300 bg-red-50 text-red-700'
      }`}
    >
      {message.text}
    </div>
  )
}

const STATUS_STYLES: Record<ResourceStatus, string> = {
  pending: 'bg-amber/20 text-amber-deep',
  approved: 'bg-teal/15 text-teal',
  rejected: 'bg-red-100 text-red-700',
  blocked: 'bg-red-100 text-red-700',
}

function StatusBadge({ status }: { status: ResourceStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
      <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
      <p className="text-xs font-semibold tracking-wide text-ink/45">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">{value ?? '—'}</p>
    </div>
  )
}

function AdminContent() {
  const { user } = useAuth()

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [venueOwners, setVenueOwners] = useState<VenueOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)
  const [action, setAction] = useState<ActionTarget | null>(null)

  const fetchData = useCallback(async () => {
    const [statsRes, orgsRes, ownersRes] = await Promise.all([
      adminApi.getStats(),
      adminApi.getOrganizations('pending'),
      adminApi.getVenueOwners('pending'),
    ])
    setStats(statsRes.data ?? null)
    setOrganizations(orgsRes.data ?? [])
    setVenueOwners(ownersRes.data ?? [])
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data')
    } finally {
      setLoading(false)
    }
  }, [fetchData])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  async function handleAction(kind: ActionTarget['kind'], id: string, actionName: 'approve' | 'reject') {
    if (action) return
    const target: ActionTarget = { kind, id, action: actionName }
    setAction(target)
    setMessage(null)
    try {
      if (kind === 'organization') {
        if (actionName === 'approve') await adminApi.approveOrganization(id)
        else await adminApi.rejectOrganization(id)
      } else {
        if (actionName === 'approve') await adminApi.approveVenueOwner(id)
        else await adminApi.rejectVenueOwner(id)
      }
      setMessage({
        type: 'success',
        text: `${actionName === 'approve' ? 'Approved' : 'Rejected'} successfully`,
      })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setAction(null)
    }
  }

  const isBusy = (target: ActionTarget) =>
    action?.kind === target.kind && action.id === target.id && action.action === target.action

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink font-sans text-paper-dim">
        <Spinner />
        <span className="text-sm text-paper-dim/55">Loading admin dashboard…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-paper-dim">
      <nav className="flex items-center justify-between border-b border-ink-line px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">
            E
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">
            EventOS Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">
            Dashboard
          </Link>
          <span className="text-sm text-paper-dim/50">{user?.email}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-10 lg:px-16">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-paper-dim sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-paper-dim/55">
            Review and approve pending organizations and venue owners.
          </p>
        </div>

        <Alert message={message} />

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadAll()}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total organizations" value={stats?.totalOrganizations ?? null} />
          <StatCard label="Pending organizations" value={stats?.pendingOrganizations ?? null} />
          <StatCard label="Total venue owners" value={stats?.totalVenueOwners ?? null} />
          <StatCard label="Pending venue owners" value={stats?.pendingVenueOwners ?? null} />
        </section>

        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Pending organizations</h2>
          {organizations.length === 0 ? (
            <p className="text-sm text-ink/45">No pending organizations.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {organizations.map((org) => (
                <li
                  key={org.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-paper-dim px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{org.organizationName}</span>
                      <StatusBadge status={org.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-ink/45">
                      {org.email} · {org.address}
                    </p>
                    {org.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-ink/60">{org.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={action !== null}
                      onClick={() => void handleAction('organization', org.id, 'approve')}
                      className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy({ kind: 'organization', id: org.id, action: 'approve' }) && <Spinner />}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={action !== null}
                      onClick={() => void handleAction('organization', org.id, 'reject')}
                      className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy({ kind: 'organization', id: org.id, action: 'reject' }) && <Spinner />}
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="relative mt-6 rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Pending venue owners</h2>
          {venueOwners.length === 0 ? (
            <p className="text-sm text-ink/45">No pending venue owners.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {venueOwners.map((owner) => (
                <li
                  key={owner.ownerId}
                  className="flex items-start justify-between gap-4 rounded-lg border border-paper-dim px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {owner.firstName} {owner.lastName}
                      </span>
                      <StatusBadge status="pending" />
                    </div>
                    <p className="mt-0.5 text-xs text-ink/45">
                      {owner.email} · {owner.venueCount} venue
                      {owner.venueCount === 1 ? '' : 's'} awaiting review
                    </p>
                    <p className="mt-1 truncate text-xs text-ink/60">
                      {owner.venues.map((v) => v.venueName).join(' · ')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={action !== null}
                      onClick={() => void handleAction('venue-owner', owner.ownerId, 'approve')}
                      className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy({ kind: 'venue-owner', id: owner.ownerId, action: 'approve' }) && <Spinner />}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={action !== null}
                      onClick={() => void handleAction('venue-owner', owner.ownerId, 'reject')}
                      className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy({ kind: 'venue-owner', id: owner.ownerId, action: 'reject' }) && <Spinner />}
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AdminRoute } from '../../components/AdminRoute'
import { Spinner } from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/adminApi'
import type { AdminStats, Organization, ResourceStatus, UserSummary, VenueOwner } from '../../types'

type Message = { type: 'success' | 'error'; text: string } | null
type Tab = 'pending' | 'approved' | 'rejected'

const STATUS_TABS: { value: Tab; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const STATUS_STYLES: Record<ResourceStatus, string> = {
  pending: 'bg-amber/20 text-amber-deep',
  approved: 'bg-teal/15 text-teal',
  rejected: 'bg-red-100 text-red-700',
  blocked: 'bg-red-100 text-red-700',
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

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-paper-dim bg-ink-soft p-1">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
            active === tab.value
              ? 'bg-amber text-ink'
              : 'text-paper-dim/60 hover:text-paper-dim'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function RejectModal({
  open,
  onReject,
  onCancel,
  loading,
}: {
  open: boolean
  onReject: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">Reject</h3>
        <p className="mt-1 text-sm text-ink/50">Provide a reason for rejecting this request.</p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Please provide valid organization information and a working email."
          className="mt-4 w-full rounded-lg border border-paper-dim bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason.trim() || loading}
            onClick={() => onReject(reason.trim())}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmRoleModal({
  open,
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  user: UserSummary | null
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  if (!open || !user) return null

  const isAdmin = user.role === 'ADMIN'
  const action = isAdmin ? 'Remove Admin' : 'Make Admin'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">{action}</h3>
        <p className="mt-1 text-sm text-ink/50">
          {isAdmin
            ? `Are you sure you want to remove admin privileges from ${user.firstName} ${user.lastName}?`
            : `Are you sure you want to grant admin privileges to ${user.firstName} ${user.lastName}?`}
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:bg-amber-deep/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            {action}
          </button>
        </div>
      </div>
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

  const [orgTab, setOrgTab] = useState<Tab>('pending')
  const [venueTab, setVenueTab] = useState<Tab>('pending')
  const [action, setAction] = useState<string | null>(null)

  const [users, setUsers] = useState<UserSummary[]>([])
  const [userPage, setUserPage] = useState(1)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [userSearchInput, setUserSearchInput] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [roleModal, setRoleModal] = useState<{ open: boolean; user: UserSummary | null }>({ open: false, user: null })
  const [roleLoading, setRoleLoading] = useState(false)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<{ kind: 'org' | 'venue'; id: string } | null>(null)
  const [rejecting, setRejecting] = useState(false)

  const fetchUsers = useCallback(async (search: string, page: number) => {
    const { data } = await adminApi.getUsers(search || undefined, page)
    if (data) {
      setUsers(data.users)
      setUserTotalPages(data.totalPages)
    }
  }, [])

  const fetchData = useCallback(async () => {
    const [statsRes, orgsRes, ownersRes] = await Promise.all([
      adminApi.getStats(),
      adminApi.getOrganizations(orgTab),
      adminApi.getVenueOwners(venueTab),
    ])
    setStats(statsRes.data ?? null)
    setOrganizations(orgsRes.data ?? [])
    setVenueOwners(ownersRes.data ?? [])
  }, [orgTab, venueTab])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchData(), fetchUsers(userSearch, userPage)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data')
    } finally {
      setLoading(false)
    }
  }, [fetchData, fetchUsers, userSearch, userPage])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    void fetchData()
  }, [orgTab, venueTab, fetchData])

  useEffect(() => {
    void fetchUsers(userSearch, userPage)
  }, [userSearch, userPage, fetchUsers])

  function handleUserSearchInput(value: string) {
    setUserSearchInput(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setUserSearch(value)
      setUserPage(1)
    }, 400)
  }

  async function handleRoleChange() {
    if (!roleModal.user || roleLoading) return
    setRoleLoading(true)
    setMessage(null)
    try {
      const newRole = roleModal.user.role === 'ADMIN' ? 'USER' : 'ADMIN'
      await adminApi.updateUserRole(roleModal.user.id, newRole)
      setMessage({ type: 'success', text: `User role updated to ${newRole}` })
      setRoleModal({ open: false, user: null })
      await fetchUsers(userSearch, userPage)
      await adminApi.getStats().then(({ data }) => { if (data) setStats(data) })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setRoleLoading(false)
    }
  }

  async function handleApprove(kind: 'org' | 'venue', id: string) {
    const key = `${kind}-${id}`
    if (action) return
    setAction(key)
    setMessage(null)
    try {
      if (kind === 'org') {
        await adminApi.approveOrganization(id)
      } else {
        await adminApi.approveVenueOwner(id)
      }
      setMessage({ type: 'success', text: 'Approved successfully' })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setAction(null)
    }
  }

  function openReject(kind: 'org' | 'venue', id: string) {
    setRejectTarget({ kind, id })
    setRejectOpen(true)
  }

  async function handleReject(reason: string) {
    if (!rejectTarget || rejecting) return
    setRejecting(true)
    setMessage(null)
    try {
      if (rejectTarget.kind === 'org') {
        await adminApi.rejectOrganization(rejectTarget.id, reason)
      } else {
        await adminApi.rejectVenueOwner(rejectTarget.id)
      }
      setMessage({ type: 'success', text: 'Rejected successfully' })
      setRejectOpen(false)
      setRejectTarget(null)
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setRejecting(false)
    }
  }

  const isBusy = (key: string) => action === key

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink font-sans text-paper-dim">
        <Spinner size={28} />
        <span className="text-sm text-paper-dim/55">Loading admin dashboard…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-paper-dim">
      <nav className="flex items-center justify-between border-b border-ink-line px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">E</span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">EventOS Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Dashboard</Link>
          <span className="text-sm text-paper-dim/50">{user?.email}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-10 lg:px-16">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-paper-dim sm:text-4xl">Admin Dashboard</h1>
          <p className="mt-2 text-paper-dim/55">Review and manage organizations, venue owners, and users.</p>
        </div>

        {message && (
          <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${message.type === 'success' ? 'border-teal/30 bg-teal/10 text-teal' : 'border-red-300 bg-red-50 text-red-700'}`}>{message.text}</div>
        )}

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => void loadAll()} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>
          </div>
        )}

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total organizations" value={stats?.totalOrganizations ?? null} />
          <StatCard label="Pending organizations" value={stats?.pendingOrganizations ?? null} />
          <StatCard label="Total venue owners" value={stats?.totalVenueOwners ?? null} />
          <StatCard label="Total users" value={stats?.totalUsers ?? null} />
        </section>

        <section className="relative mb-8 rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Organizations</h2>
            <TabBar active={orgTab} onChange={setOrgTab} />
          </div>
          {organizations.length === 0 ? (
            <p className="text-sm text-ink/45">No {orgTab} organizations.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {organizations.map((org) => {
                const ownerObj = typeof org.ownerId === 'object' && org.ownerId !== null ? org.ownerId : null
                return (
                  <li key={org.id} className="flex items-start justify-between gap-4 rounded-lg border border-paper-dim px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{org.organizationName}</span>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[org.status]}`}>{org.status}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink/45">
                        Owner: {ownerObj ? `${ownerObj.firstName} ${ownerObj.lastName}` : '—'} · {ownerObj?.email ?? '—'}
                      </p>
                      {org.rejectionReason && org.status === 'rejected' && (
                        <p className="mt-1 text-xs text-red-600">Reason: {org.rejectionReason}</p>
                      )}
                      <p className="mt-0.5 text-xs text-ink/35">Created {new Date(org.createdAt).toLocaleDateString()}</p>
                    </div>
                    {org.status === 'pending' && (
                      <div className="flex shrink-0 gap-2">
                        <button type="button" disabled={action !== null} onClick={() => void handleApprove('org', org.id)} className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60">
                          {isBusy(`org-${org.id}`) && <Spinner size={12} />}Approve
                        </button>
                        <button type="button" disabled={action !== null} onClick={() => openReject('org', org.id)} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Venue Owners</h2>
            <TabBar active={venueTab} onChange={setVenueTab} />
          </div>
          {venueOwners.length === 0 ? (
            <p className="text-sm text-ink/45">No {venueTab} venue owners.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {venueOwners.map((owner) => (
                <li key={owner.ownerId} className="flex items-start justify-between gap-4 rounded-lg border border-paper-dim px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{owner.firstName} {owner.lastName}</span>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[venueTab]}`}>{venueTab}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink/45">{owner.email} · {owner.venueCount} venue{owner.venueCount === 1 ? '' : 's'}</p>
                    <p className="mt-1 truncate text-xs text-ink/60">{owner.venues.map((v) => v.venueName).join(' · ')}</p>
                  </div>
                  {venueTab === 'pending' && (
                    <div className="flex shrink-0 gap-2">
                      <button type="button" disabled={action !== null} onClick={() => void handleApprove('venue', owner.ownerId)} className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60">
                        {isBusy(`venue-${owner.ownerId}`) && <Spinner size={12} />}Approve
                      </button>
                      <button type="button" disabled={action !== null} onClick={() => openReject('venue', owner.ownerId)} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Users</h2>
            <input
              type="text"
              value={userSearchInput}
              onChange={(e) => handleUserSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="w-56 rounded-lg border border-paper-dim bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink/35 outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
            />
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-ink/45">No users found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-paper-dim text-xs text-ink/45">
                      <th className="pb-2 pr-4 font-semibold">Name</th>
                      <th className="pb-2 pr-4 font-semibold">Email</th>
                      <th className="pb-2 pr-4 font-semibold">Role</th>
                      <th className="pb-2 pr-4 font-semibold">Provider</th>
                      <th className="pb-2 font-semibold">Joined</th>
                      <th className="pb-2 pl-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = u.id === user?.id
                      return (
                        <tr key={u.id} className="border-b border-paper-dim/50 last:border-0">
                          <td className="py-2.5 pr-4 font-semibold text-ink">{u.firstName} {u.lastName}</td>
                          <td className="py-2.5 pr-4 text-ink/60">{u.email}</td>
                          <td className="py-2.5 pr-4">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-amber/20 text-amber-deep' : 'bg-ink-soft text-ink/60'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-ink/50">{u.provider}</td>
                          <td className="py-2.5 text-ink/45">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-2.5 pl-4 text-right">
                            {isSelf ? (
                              <span className="text-xs text-ink/30">You</span>
                            ) : (
                              <button
                                type="button"
                                disabled={action !== null}
                                onClick={() => setRoleModal({ open: true, user: u })}
                                className="rounded-lg border border-paper-dim px-3 py-1 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {u.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {userTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => p - 1)}
                    className="rounded-lg border border-paper-dim px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-ink/45">Page {userPage} of {userTotalPages}</span>
                  <button
                    type="button"
                    disabled={userPage >= userTotalPages}
                    onClick={() => setUserPage((p) => p + 1)}
                    className="rounded-lg border border-paper-dim px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <RejectModal open={rejectOpen} onReject={handleReject} onCancel={() => { setRejectOpen(false); setRejectTarget(null) }} loading={rejecting} />
      <ConfirmRoleModal open={roleModal.open} user={roleModal.user} onConfirm={handleRoleChange} onCancel={() => setRoleModal({ open: false, user: null })} loading={roleLoading} />
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

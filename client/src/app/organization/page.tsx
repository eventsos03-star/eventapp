'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { Spinner } from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { organizationApi } from '../../lib/organizationApi'
import type { Organization, ResourceStatus } from '../../types'

type Message = { type: 'success' | 'error'; text: string } | null

const STATUS_CONFIG: Record<ResourceStatus, { label: string; className: string }> = {
  pending: { label: 'Pending Review', className: 'bg-amber/20 text-amber-deep' },
  approved: { label: 'Approved', className: 'bg-teal/15 text-teal' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  blocked: { label: 'Blocked', className: 'bg-red-100 text-red-700' },
}

const ORG_TYPE_LABELS: Record<string, string> = {
  college: 'College / University',
  company: 'Company',
  startup: 'Startup',
  ngo: 'NGO',
  community: 'Community',
  event_org: 'Event Organization',
  other: 'Other',
}

function inputClass() {
  return 'rounded-lg border border-paper-dim bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30'
}

function StatusBadge({ status }: { status: ResourceStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function OrgContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    organizationName: '',
    description: '',
    email: '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchOrg = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await organizationApi.getMy()
      setOrg(data ?? null)
    } catch {
      setOrg(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOrg()
  }, [fetchOrg])

  function startEditing() {
    if (!org) return
    const addr = org.address ?? { street: '', city: '', state: '', postalCode: '', country: '' }
    setEditForm({
      organizationName: org.organizationName,
      description: org.description ?? '',
      email: org.email,
      phoneNumber: org.phoneNumber ?? '',
      street: addr.street,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
    })
    setEditing(true)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const { data } = await organizationApi.update({
        organizationName: editForm.organizationName,
        description: editForm.description || undefined,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber || undefined,
        address: {
          street: editForm.street,
          city: editForm.city,
          state: editForm.state,
          postalCode: editForm.postalCode,
          country: editForm.country,
        },
      })
      setOrg(data ?? org)
      setEditing(false)
      setMessage({ type: 'success', text: 'Organization updated' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Spinner size={28} />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-ink font-sans text-paper-dim">
        <nav className="flex items-center justify-between border-b border-ink-line px-5 py-6 sm:px-10 lg:px-16">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">E</span>
            <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">EventOS</span>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && <Link href="/admin" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Admin</Link>}
            <Link href="/dashboard" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Dashboard</Link>
          </div>
        </nav>
        <main className="mx-auto max-w-2xl px-5 pb-24 pt-16 sm:px-10 text-center">
          <div className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-12">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h1 className="font-display text-2xl font-semibold text-ink">No Organization Yet</h1>
            <p className="mt-3 text-sm text-ink/50">Create an organization to start managing events.</p>
            <Link href="/organization/create" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep">
              Create Organization
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (org.status === 'pending') {
    return (
      <div className="min-h-screen bg-ink font-sans text-paper-dim">
        <nav className="flex items-center justify-between border-b border-ink-line px-5 py-6 sm:px-10 lg:px-16">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">E</span>
            <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">EventOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Dashboard</Link>
            <span className="text-sm text-paper-dim/50">{user?.email}</span>
          </div>
        </nav>
        <main className="mx-auto max-w-2xl px-5 pb-24 pt-16 sm:px-10">
          <div className="relative rounded-2xl border border-amber/30 bg-paper px-6.5 py-10 text-center">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <StatusBadge status="pending" />
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{org.organizationName}</h1>
            <p className="mt-3 text-sm text-ink/50">Your organization is under review. Our platform team will review it before you can access organization features.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => void fetchOrg()} className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10">Refresh Status</button>
              <Link href="/dashboard" className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:bg-amber-deep">Back to Dashboard</Link>
            </div>
          </div>

          <div className="mt-6 relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">Organization Details</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold tracking-wide text-ink/45">TYPE</dt><dd className="mt-1 text-ink">{ORG_TYPE_LABELS[org.organizationType] ?? org.organizationType}</dd></div>
              <div><dt className="text-xs font-semibold tracking-wide text-ink/45">EMAIL</dt><dd className="mt-1 text-ink">{org.email}</dd></div>
              {org.phoneNumber && <div><dt className="text-xs font-semibold tracking-wide text-ink/45">PHONE</dt><dd className="mt-1 text-ink">{org.phoneNumber}</dd></div>}
              {org.description && <div className="sm:col-span-2"><dt className="text-xs font-semibold tracking-wide text-ink/45">DESCRIPTION</dt><dd className="mt-1 text-ink">{org.description}</dd></div>}
            </dl>
          </div>
        </main>
      </div>
    )
  }

  if (org.status === 'rejected') {
    return (
      <div className="min-h-screen bg-ink font-sans text-paper-dim">
        <nav className="flex items-center justify-between border-b border-ink-line px-5 py-6 sm:px-10 lg:px-16">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">E</span>
            <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">EventOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Dashboard</Link>
            <span className="text-sm text-paper-dim/50">{user?.email}</span>
          </div>
        </nav>
        <main className="mx-auto max-w-2xl px-5 pb-24 pt-16 sm:px-10">
          <div className="relative rounded-2xl border border-red-300 bg-paper px-6.5 py-10 text-center">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <StatusBadge status="rejected" />
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{org.organizationName}</h1>
            {org.rejectionReason && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">Reason:</span> {org.rejectionReason}
              </div>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={startEditing} className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:bg-amber-deep">Edit &amp; Resubmit</button>
              <Link href="/dashboard" className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10">Back to Dashboard</Link>
            </div>
          </div>

          {editing && (
            <div className="mt-6 relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
              <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
              <h2 className="mb-4 font-display text-xl font-semibold text-ink">Edit Organization</h2>
              {message && (
                <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${message.type === 'success' ? 'border-teal/30 bg-teal/10 text-teal' : 'border-red-300 bg-red-50 text-red-700'}`}>{message.text}</div>
              )}
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">ORGANIZATION NAME</span>
                  <input required value={editForm.organizationName} onChange={(e) => setEditForm((p) => ({ ...p, organizationName: e.target.value }))} className={inputClass()} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">EMAIL</span>
                  <input required type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className={inputClass()} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">DESCRIPTION</span>
                  <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className={inputClass()} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">PHONE</span>
                  <input value={editForm.phoneNumber} onChange={(e) => setEditForm((p) => ({ ...p, phoneNumber: e.target.value }))} className={inputClass()} />
                </label>
                <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-60">
                  {saving && <Spinner size={16} />}
                  Save &amp; Resubmit for Review
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-paper-dim">
      <nav className="flex items-center justify-between border-b border-ink-line px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">E</span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">EventOS</span>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'ADMIN' && <Link href="/admin" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Admin</Link>}
          <Link href="/organization/members" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Members</Link>
          <Link href="/dashboard" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Dashboard</Link>
          <span className="text-sm text-paper-dim/50">{user?.email}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-12 sm:px-10 lg:px-16">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-paper-dim sm:text-4xl">{org.organizationName}</h1>
            <p className="mt-2 text-paper-dim/55">Organization dashboard</p>
          </div>
          <StatusBadge status={org.status} />
        </div>

        {message && (
          <div className={`mb-6 rounded-lg border px-4 py-2.5 text-sm ${message.type === 'success' ? 'border-teal/30 bg-teal/10 text-teal' : 'border-red-300 bg-red-50 text-red-700'}`}>{message.text}</div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6 lg:col-span-2">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-ink">Organization Details</h2>
              {!editing && <button type="button" onClick={startEditing} className="text-xs font-semibold text-amber transition hover:text-amber-deep">Edit</button>}
            </div>
            {editing ? (
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">ORGANIZATION NAME</span>
                    <input required value={editForm.organizationName} onChange={(e) => setEditForm((p) => ({ ...p, organizationName: e.target.value }))} className={inputClass()} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">EMAIL</span>
                    <input required type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className={inputClass()} />
                  </label>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">DESCRIPTION</span>
                  <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className={inputClass()} />
                </label>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-60">
                    {saving && <Spinner size={14} />}Save
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10">Cancel</button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-xs font-semibold tracking-wide text-ink/45">TYPE</dt><dd className="mt-1 text-ink">{ORG_TYPE_LABELS[org.organizationType] ?? org.organizationType}</dd></div>
                <div><dt className="text-xs font-semibold tracking-wide text-ink/45">EMAIL</dt><dd className="mt-1 text-ink">{org.email}</dd></div>
                {org.phoneNumber && <div><dt className="text-xs font-semibold tracking-wide text-ink/45">PHONE</dt><dd className="mt-1 text-ink">{org.phoneNumber}</dd></div>}
                {org.address && <div><dt className="text-xs font-semibold tracking-wide text-ink/45">LOCATION</dt><dd className="mt-1 text-ink">{[org.address.city, org.address.state].filter(Boolean).join(', ') || org.address.country}</dd></div>}
                {org.description && <div className="sm:col-span-2 lg:col-span-4"><dt className="text-xs font-semibold tracking-wide text-ink/45">DESCRIPTION</dt><dd className="mt-1 text-ink">{org.description}</dd></div>}
              </dl>
            )}
          </section>

          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-4 font-display text-xl font-semibold text-ink">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <Link href="/organization/members" className="rounded-lg border border-paper-dim px-4 py-3 text-sm font-semibold text-ink transition hover:bg-paper-dim/10">Manage Members</Link>
              <span className="rounded-lg border border-ink-line px-4 py-3 text-sm text-ink/30 cursor-not-allowed">Create Event — Coming Soon</span>
              <span className="rounded-lg border border-ink-line px-4 py-3 text-sm text-ink/30 cursor-not-allowed">Venue Booking — Coming Soon</span>
            </div>
          </section>

          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-4 font-display text-xl font-semibold text-ink">Status</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div><dt className="text-xs font-semibold tracking-wide text-ink/45">APPROVED</dt><dd className="mt-1 text-ink">{org.approvedAt ? new Date(org.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</dd></div>
              <div><dt className="text-xs font-semibold tracking-wide text-ink/45">CREATED</dt><dd className="mt-1 text-ink">{new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
            </dl>
          </section>
        </div>
      </main>
    </div>
  )
}

export default function OrganizationPage() {
  return (
    <ProtectedRoute>
      <OrgContent />
    </ProtectedRoute>
  )
}

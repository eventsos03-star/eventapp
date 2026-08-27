'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AdminRoute } from '../../components/AdminRoute'
import { Spinner } from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/adminApi'
import type { AdminEvent, AdminStats, Organization, UserSummary, VenueOwner } from '../../types'

type Message = { type: 'success' | 'error'; text: string } | null
type Tab = 'pending' | 'approved' | 'rejected' | 'deleted'
type UserTab = 'all' | 'deleted'
type EventTab = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'

const STATUS_TABS: { value: Tab; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'deleted', label: 'Deleted' },
]

const EVENT_TABS: { value: EventTab; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
 
]

const STATUS_STYLES: Record<Tab | 'blocked', string> = {
  pending: 'bg-amber/20 text-amber-deep',
  approved: 'bg-teal/15 text-teal',
  rejected: 'bg-red-100 text-red-700',
  blocked: 'bg-red-100 text-red-700',
  deleted: 'bg-ink-soft text-ink/60',
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

function EventTabBar({ active, onChange }: { active: EventTab; onChange: (t: EventTab) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-paper-dim bg-ink-soft p-1">
      {EVENT_TABS.map((tab) => (
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

function ConfirmDeleteModal({
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">Delete User</h3>
        <p className="mt-1 text-sm text-ink/50">
          Are you sure you want to delete {user.firstName} {user.lastName}? This action cannot be undone.
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
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmRestoreModal({
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">Restore User</h3>
        <p className="mt-1 text-sm text-ink/50">
          Are you sure you want to restore {user.firstName} {user.lastName}? They will regain access to their account.
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
            className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            Restore
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  tone = 'teal',
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  tone?: 'teal' | 'red'
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  if (!open) return null

  const confirmClass =
    tone === 'red'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-teal text-white hover:bg-teal/80'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-ink/50">{message}</p>
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
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {loading && <Spinner size={14} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function PermanentDeleteModal({
  open,
  title,
  subject,
  confirmName,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  subject: string
  confirmName: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const [phrase, setPhrase] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-red-300 bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-red-700">{title}</h3>
        <p className="mt-1 text-sm text-ink/60">
          Deleting <span className="font-semibold text-ink">{subject}</span> is permanent and cannot be undone. Please type{' '}
          <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-red-700">{confirmName}</span>{' '}
          to confirm.
        </p>
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={confirmName}
          className="mt-4 w-full rounded-lg border border-paper-dim bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
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
            disabled={phrase !== confirmName || loading}
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            Delete permanently
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
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)

  const [orgTab, setOrgTab] = useState<Tab>('pending')
  const [venueTab, setVenueTab] = useState<Tab>('pending')
  const [eventTab, setEventTab] = useState<EventTab>('draft')
  const [action, setAction] = useState<string | null>(null)
  const [eventAction, setEventAction] = useState<string | null>(null)

  const [users, setUsers] = useState<UserSummary[]>([])
  const [userPage, setUserPage] = useState(1)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [userSearchInput, setUserSearchInput] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [roleModal, setRoleModal] = useState<{ open: boolean; user: UserSummary | null }>({ open: false, user: null })
  const [roleLoading, setRoleLoading] = useState(false)

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: UserSummary | null }>({ open: false, user: null })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [userTab, setUserTab] = useState<UserTab>('all')
  const [deletedUsers, setDeletedUsers] = useState<UserSummary[]>([])
  const [deletedUserPage, setDeletedUserPage] = useState(1)
  const [deletedUserTotalPages, setDeletedUserTotalPages] = useState(1)
  const [deletedUserSearch, setDeletedUserSearch] = useState('')
  const [deletedUserSearchInput, setDeletedUserSearchInput] = useState('')
  const deletedSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [restoreModal, setRestoreModal] = useState<{ open: boolean; user: UserSummary | null }>({ open: false, user: null })
  const [restoreLoading, setRestoreLoading] = useState(false)

  const [orgDeleteModal, setOrgDeleteModal] = useState<{ open: boolean; org: Organization | null }>({ open: false, org: null })
  const [orgDeleteLoading, setOrgDeleteLoading] = useState(false)

  const [orgRestoreModal, setOrgRestoreModal] = useState<{ open: boolean; org: Organization | null }>({ open: false, org: null })
  const [orgRestoreLoading, setOrgRestoreLoading] = useState(false)

  const [venueRestoreModal, setVenueRestoreModal] = useState<{ open: boolean; owner: VenueOwner | null }>({ open: false, owner: null })
  const [venueRestoreLoading, setVenueRestoreLoading] = useState(false)

  const [permUserModal, setPermUserModal] = useState<{ open: boolean; user: UserSummary | null }>({ open: false, user: null })
  const [permUserLoading, setPermUserLoading] = useState(false)

  const [permOrgModal, setPermOrgModal] = useState<{ open: boolean; org: Organization | null }>({ open: false, org: null })
  const [permOrgLoading, setPermOrgLoading] = useState(false)

  const [permVenueModal, setPermVenueModal] = useState<{ open: boolean; owner: VenueOwner | null }>({ open: false, owner: null })
  const [permVenueLoading, setPermVenueLoading] = useState(false)

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

  const fetchDeletedUsers = useCallback(async (search: string, page: number) => {
    const { data } = await adminApi.getDeletedUsers(search || undefined, page)
    if (data) {
      setDeletedUsers(data.users)
      setDeletedUserTotalPages(data.totalPages)
    }
  }, [])

  const fetchData = useCallback(async () => {
    const [statsRes, orgsRes, ownersRes, eventsRes] = await Promise.all([
      adminApi.getStats(),
      adminApi.getOrganizations(orgTab),
      adminApi.getVenueOwners(venueTab),
      adminApi.getAllEvents(),
    ])
    setStats(statsRes.data ?? null)
    setOrganizations(orgsRes.data ?? [])
    setVenueOwners(ownersRes.data ?? [])
    setEvents(eventsRes.data ?? [])
  }, [orgTab, venueTab])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchData(), fetchUsers(userSearch, userPage), fetchDeletedUsers(deletedUserSearch, deletedUserPage)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data')
    } finally {
      setLoading(false)
    }
  }, [fetchData, fetchUsers, fetchDeletedUsers, userSearch, userPage, deletedUserSearch, deletedUserPage])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    void fetchData()
  }, [orgTab, venueTab, fetchData])

  useEffect(() => {
    void fetchUsers(userSearch, userPage)
  }, [userSearch, userPage, fetchUsers])

  useEffect(() => {
    void fetchDeletedUsers(deletedUserSearch, deletedUserPage)
  }, [deletedUserSearch, deletedUserPage, fetchDeletedUsers])

  function handleUserSearchInput(value: string) {
    setUserSearchInput(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setUserSearch(value)
      setUserPage(1)
    }, 400)
  }

  function handleDeletedUserSearchInput(value: string) {
    setDeletedUserSearchInput(value)
    if (deletedSearchTimerRef.current) clearTimeout(deletedSearchTimerRef.current)
    deletedSearchTimerRef.current = setTimeout(() => {
      setDeletedUserSearch(value)
      setDeletedUserPage(1)
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

  async function handleDeleteUser() {
    if (!deleteModal.user || deleteLoading) return
    setDeleteLoading(true)
    setMessage(null)
    try {
      await adminApi.deleteUser(deleteModal.user.id)
      setMessage({ type: 'success', text: 'User deleted successfully' })
      setDeleteModal({ open: false, user: null })
      await fetchUsers(userSearch, userPage)
      await adminApi.getStats().then(({ data }) => { if (data) setStats(data) })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleRestoreUser() {
    if (!restoreModal.user || restoreLoading) return
    setRestoreLoading(true)
    setMessage(null)
    try {
      await adminApi.restoreUser(restoreModal.user.id)
      setMessage({ type: 'success', text: 'User restored successfully' })
      setRestoreModal({ open: false, user: null })
      await fetchDeletedUsers(deletedUserSearch, deletedUserPage)
      await fetchUsers(userSearch, userPage)
      await adminApi.getStats().then(({ data }) => { if (data) setStats(data) })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Restore failed' })
    } finally {
      setRestoreLoading(false)
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

  async function handlePublishEvent(id: string) {
    if (eventAction) return
    setEventAction(id)
    setMessage(null)
    try {
      await adminApi.publishEvent(id)
      setMessage({ type: 'success', text: 'Event published' })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Publish failed' })
    } finally {
      setEventAction(null)
    }
  }

  async function handleDeleteEvent(id: string) {
    if (eventAction) return
    if (!confirm('Delete this event? This cannot be undone.')) return
    setEventAction(id)
    setMessage(null)
    try {
      await adminApi.deleteEvent(id)
      setMessage({ type: 'success', text: 'Event deleted' })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setEventAction(null)
    }
  }

  async function handleDeleteOrganization() {
    if (!orgDeleteModal.org || orgDeleteLoading) return
    setOrgDeleteLoading(true)
    setMessage(null)
    try {
      await adminApi.deleteOrganization(orgDeleteModal.org.id)
      setMessage({ type: 'success', text: 'Organization deleted' })
      setOrgDeleteModal({ open: false, org: null })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setOrgDeleteLoading(false)
    }
  }

  async function handleRestoreOrganization() {
    if (!orgRestoreModal.org || orgRestoreLoading) return
    setOrgRestoreLoading(true)
    setMessage(null)
    try {
      await adminApi.restoreOrganization(orgRestoreModal.org.id)
      setMessage({ type: 'success', text: 'Organization restored' })
      setOrgRestoreModal({ open: false, org: null })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Restore failed' })
    } finally {
      setOrgRestoreLoading(false)
    }
  }

  async function handleRestoreVenueOwner() {
    if (!venueRestoreModal.owner || venueRestoreLoading) return
    setVenueRestoreLoading(true)
    setMessage(null)
    try {
      await adminApi.restoreVenueOwner(venueRestoreModal.owner.ownerId)
      setMessage({ type: 'success', text: 'Venues restored' })
      setVenueRestoreModal({ open: false, owner: null })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Restore failed' })
    } finally {
      setVenueRestoreLoading(false)
    }
  }

  async function handlePermanentDeleteUser() {
    if (!permUserModal.user || permUserLoading) return
    setPermUserLoading(true)
    setMessage(null)
    try {
      await adminApi.permanentDeleteUser(permUserModal.user.id, `${permUserModal.user.firstName} ${permUserModal.user.lastName}`)
      setMessage({ type: 'success', text: 'User permanently deleted' })
      setPermUserModal({ open: false, user: null })
      await fetchDeletedUsers(deletedUserSearch, deletedUserPage)
      await adminApi.getStats().then(({ data }) => { if (data) setStats(data) })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setPermUserLoading(false)
    }
  }

  async function handlePermanentDeleteOrganization() {
    if (!permOrgModal.org || permOrgLoading) return
    setPermOrgLoading(true)
    setMessage(null)
    try {
      await adminApi.permanentDeleteOrganization(permOrgModal.org.id, permOrgModal.org.organizationName)
      setMessage({ type: 'success', text: 'Organization permanently deleted' })
      setPermOrgModal({ open: false, org: null })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setPermOrgLoading(false)
    }
  }

  async function handlePermanentDeleteVenueOwner() {
    if (!permVenueModal.owner || permVenueLoading) return
    setPermVenueLoading(true)
    setMessage(null)
    try {
      await adminApi.permanentDeleteVenueOwner(permVenueModal.owner.ownerId, `${permVenueModal.owner.firstName} ${permVenueModal.owner.lastName}`)
      setMessage({ type: 'success', text: 'Venues permanently deleted' })
      setPermVenueModal({ open: false, owner: null })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setPermVenueLoading(false)
    }
  }

  const isBusy = (key: string) => action === key
  const filteredEvents = events.filter((e) => e.status === eventTab)

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

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total organizations" value={stats?.totalOrganizations ?? null} />
          <StatCard label="Pending organizations" value={stats?.pendingOrganizations ?? null} />
          <StatCard label="Total venue owners" value={stats?.totalVenueOwners ?? null} />
          <StatCard label="Pending venue owners" value={stats?.pendingVenueOwners ?? null} />
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
                        {orgTab === 'deleted' ? (
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES.deleted}`}>deleted</span>
                        ) : (
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[org.status]}`}>{org.status}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-ink/45">
                        Owner: {ownerObj ? `${ownerObj.firstName} ${ownerObj.lastName}` : '—'} · {ownerObj?.email ?? '—'}
                      </p>
                      {org.rejectionReason && org.status === 'rejected' && (
                        <p className="mt-1 text-xs text-red-600">Reason: {org.rejectionReason}</p>
                      )}
                      {orgTab === 'deleted' && org.isOwnerDeleted && (
                        <p className="mt-1 text-xs text-ink/45">Owner is deleted — restore via Users → Deleted</p>
                      )}
                      <p className="mt-0.5 text-xs text-ink/35">Created {new Date(org.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {orgTab === 'pending' && org.status === 'pending' && (
                        <>
                          <button type="button" disabled={action !== null} onClick={() => void handleApprove('org', org.id)} className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60">
                            {isBusy(`org-${org.id}`) && <Spinner size={12} />}Approve
                          </button>
                          <button type="button" disabled={action !== null} onClick={() => openReject('org', org.id)} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                            Reject
                          </button>
                        </>
                      )}
                      {orgTab === 'deleted' && org.isOwnerDeleted === false && (
                        <button type="button" disabled={action !== null} onClick={() => setOrgRestoreModal({ open: true, org })} className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60">
                          Restore
                        </button>
                      )}
                      {orgTab === 'deleted' && (
                        <button type="button" disabled={action !== null} onClick={() => setPermOrgModal({ open: true, org })} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                          Delete permanently
                        </button>
                      )}
                      {orgTab !== 'deleted' && (
                        <button type="button" disabled={action !== null} onClick={() => setOrgDeleteModal({ open: true, org })} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="relative mb-8 rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
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
                    {venueTab === 'deleted' && owner.isOwnerDeleted && (
                      <p className="mt-1 text-xs text-ink/45">Owner is deleted — restore via Users → Deleted</p>
                    )}
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
                  {venueTab === 'deleted' && owner.isOwnerDeleted === false && (
                    <div className="flex shrink-0 gap-2">
                      <button type="button" disabled={action !== null} onClick={() => setVenueRestoreModal({ open: true, owner })} className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60">
                        Restore venues
                      </button>
                    </div>
                  )}
                  {venueTab === 'deleted' && (
                    <div className="flex shrink-0 gap-2">
                      <button type="button" disabled={action !== null} onClick={() => setPermVenueModal({ open: true, owner })} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                        Delete permanently
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-semibold text-ink">Users</h2>
              <div className="flex gap-1 rounded-lg border border-paper-dim bg-ink-soft p-1">
                {(['all', 'deleted'] as UserTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setUserTab(tab)}
                    className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                      userTab === tab
                        ? 'bg-amber text-ink'
                        : 'text-paper-dim/60 hover:text-paper-dim'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={userTab === 'deleted' ? deletedUserSearchInput : userSearchInput}
              onChange={(e) => (userTab === 'deleted' ? handleDeletedUserSearchInput(e.target.value) : handleUserSearchInput(e.target.value))}
              placeholder="Search by name or email…"
              className="w-56 rounded-lg border border-paper-dim bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink/35 outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
            />
          </div>
          {userTab === 'deleted' ? (
            deletedUsers.length === 0 ? (
              <p className="text-sm text-ink/45">No deleted users found.</p>
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
                      {deletedUsers.map((u) => (
                        <tr key={u.id} className="border-b border-paper-dim/50 last:border-0">
                          <td className="py-2.5 pr-4 font-semibold text-ink">{u.firstName} {u.lastName}</td>
                          <td className="py-2.5 pr-4 text-ink/60">{u.email}</td>
                          <td className="py-2.5 pr-4">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-amber/20 text-amber-deep' : 'bg-amber/20 text-amber-deep'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-ink/50">{u.provider}</td>
                          <td className="py-2.5 text-ink/45">{new Date(u.createdAt).toLocaleDateString()}</td>
                          {u.role === 'ADMIN' ? (
                            <td className="py-2.5 pl-4 text-right text-xs text-ink/30">Cannot restore admin</td>
                          ) : (
                            <td className="py-2.5 pl-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={action !== null}
                                  onClick={() => setRestoreModal({ open: true, user: u })}
                                  className="rounded-lg border border-teal/40 px-3 py-1 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  disabled={action !== null}
                                  onClick={() => setPermUserModal({ open: true, user: u })}
                                  className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Delete permanently
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {deletedUserTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={deletedUserPage <= 1}
                      onClick={() => setDeletedUserPage((p) => p - 1)}
                      className="rounded-lg border border-paper-dim px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-ink/45">Page {deletedUserPage} of {deletedUserTotalPages}</span>
                    <button
                      type="button"
                      disabled={deletedUserPage >= deletedUserTotalPages}
                      onClick={() => setDeletedUserPage((p) => p + 1)}
                      className="rounded-lg border border-paper-dim px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
          users.length === 0 ? (
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
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-amber/20 text-amber-deep' : 'bg-amber/20 text-amber-deep'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-ink/50">{u.provider}</td>
                          <td className="py-2.5 text-ink/45">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-2.5 pl-4 text-right">
                            {isSelf ? (
                              <span className="text-xs text-ink/30">You</span>
                            ) : u.role === 'ADMIN' ? (
                              <button
                                type="button"
                                disabled={action !== null}
                                onClick={() => setRoleModal({ open: true, user: u })}
                                className="rounded-lg border border-paper-dim px-3 py-1 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove Admin
                              </button>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={action !== null}
                                  onClick={() => setRoleModal({ open: true, user: u })}
                                  className="rounded-lg border border-paper-dim px-3 py-1 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Make Admin
                                </button>
                                <button
                                  type="button"
                                  disabled={action !== null}
                                  onClick={() => setDeleteModal({ open: true, user: u })}
                                  className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Delete
                                </button>
                              </div>
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
          ))}
        </section>

        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">Events</h2>
            <EventTabBar active={eventTab} onChange={setEventTab} />
          </div>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-ink/45">No {eventTab} events.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {filteredEvents.map((event) => (
                <li key={event._id} className="flex items-start justify-between gap-4 rounded-lg border border-paper-dim px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{event.eventName}</span>
                      <span className="inline-block rounded-full bg-ink-soft px-2.5 py-0.5 text-xs font-semibold text-ink/70">
                        {event.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink/45">
                      Org: {event.organizationId?.organizationName ?? 'Unknown / deleted org'} · {event.eventType} · {event.registrationType}
                    </p>
                    <p className="mt-0.5 text-xs text-ink/35">
                      Event date {new Date(event.eventDate).toLocaleDateString()} · Created {new Date(event.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {event.status === 'draft' && (
                      <button
                        type="button"
                        disabled={eventAction !== null}
                        onClick={() => void handlePublishEvent(event._id)}
                        className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {eventAction === event._id && <Spinner size={12} />}
                        Publish
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={eventAction !== null}
                      onClick={() => void handleDeleteEvent(event._id)}
                      className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {eventAction === event._id && <Spinner size={12} />}
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <RejectModal open={rejectOpen} onReject={handleReject} onCancel={() => { setRejectOpen(false); setRejectTarget(null) }} loading={rejecting} />
      <ConfirmRoleModal open={roleModal.open} user={roleModal.user} onConfirm={handleRoleChange} onCancel={() => setRoleModal({ open: false, user: null })} loading={roleLoading} />
      <ConfirmDeleteModal open={deleteModal.open} user={deleteModal.user} onConfirm={handleDeleteUser} onCancel={() => setDeleteModal({ open: false, user: null })} loading={deleteLoading} />
      <ConfirmRestoreModal open={restoreModal.open} user={restoreModal.user} onConfirm={handleRestoreUser} onCancel={() => setRestoreModal({ open: false, user: null })} loading={restoreLoading} />

      <ConfirmDialog
        open={orgDeleteModal.open}
        title="Delete Organization"
        message={`Delete ${orgDeleteModal.org?.organizationName ?? 'this organization'}? It will be moved to the Deleted tab and hidden from the owner.`}
        confirmLabel="Delete"
        tone="red"
        onConfirm={handleDeleteOrganization}
        onCancel={() => setOrgDeleteModal({ open: false, org: null })}
        loading={orgDeleteLoading}
      />
      <ConfirmDialog
        open={orgRestoreModal.open}
        title="Restore Organization"
        message={`Restore ${orgRestoreModal.org?.organizationName ?? 'this organization'}? The owner will regain access.`}
        confirmLabel="Restore"
        onConfirm={handleRestoreOrganization}
        onCancel={() => setOrgRestoreModal({ open: false, org: null })}
        loading={orgRestoreLoading}
      />
      <ConfirmDialog
        open={venueRestoreModal.open}
        title="Restore Venues"
        message={`Restore all deleted venues of ${venueRestoreModal.owner ? `${venueRestoreModal.owner.firstName} ${venueRestoreModal.owner.lastName}` : 'this owner'}?`}
        confirmLabel="Restore"
        onConfirm={handleRestoreVenueOwner}
        onCancel={() => setVenueRestoreModal({ open: false, owner: null })}
        loading={venueRestoreLoading}
      />

      <PermanentDeleteModal
        open={permUserModal.open}
        title="Permanently delete user"
        subject={permUserModal.user ? `${permUserModal.user.firstName} ${permUserModal.user.lastName}` : ''}
        confirmName={permUserModal.user ? `${permUserModal.user.firstName} ${permUserModal.user.lastName}` : ''}
        loading={permUserLoading}
        onConfirm={handlePermanentDeleteUser}
        onCancel={() => setPermUserModal({ open: false, user: null })}
      />
      <PermanentDeleteModal
        open={permOrgModal.open}
        title="Permanently delete organization"
        subject={permOrgModal.org?.organizationName ?? ''}
        confirmName={permOrgModal.org?.organizationName ?? ''}
        loading={permOrgLoading}
        onConfirm={handlePermanentDeleteOrganization}
        onCancel={() => setPermOrgModal({ open: false, org: null })}
      />
      <PermanentDeleteModal
        open={permVenueModal.open}
        title="Permanently delete venues"
        subject={permVenueModal.owner ? `${permVenueModal.owner.firstName} ${permVenueModal.owner.lastName}` : ''}
        confirmName={permVenueModal.owner ? `${permVenueModal.owner.firstName} ${permVenueModal.owner.lastName}` : ''}
        loading={permVenueLoading}
        onConfirm={handlePermanentDeleteVenueOwner}
        onCancel={() => setPermVenueModal({ open: false, owner: null })}
      />
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
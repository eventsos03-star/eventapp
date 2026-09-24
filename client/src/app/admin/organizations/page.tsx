'use client'

import { useCallback, useEffect, useState } from 'react'
import { Spinner } from '../../../components/Spinner'
import { adminApi } from '../../../lib/adminApi'
import type { Organization } from '../../../types'
import { TabBar, STATUS_STYLES, type Message, type Tab } from '../../../components/admin/ui'
import { RejectModal, ConfirmDialog, PermanentDeleteModal } from '../../../components/admin/modals'

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)

  const [orgTab, setOrgTab] = useState<Tab>('pending')
  const [action, setAction] = useState<string | null>(null)

  const [orgDeleteModal, setOrgDeleteModal] = useState<{ open: boolean; org: Organization | null }>({ open: false, org: null })
  const [orgDeleteLoading, setOrgDeleteLoading] = useState(false)

  const [orgRestoreModal, setOrgRestoreModal] = useState<{ open: boolean; org: Organization | null }>({ open: false, org: null })
  const [orgRestoreLoading, setOrgRestoreLoading] = useState(false)

  const [permOrgModal, setPermOrgModal] = useState<{ open: boolean; org: Organization | null }>({ open: false, org: null })
  const [permOrgLoading, setPermOrgLoading] = useState(false)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<{ kind: 'org'; id: string } | null>(null)
  const [rejecting, setRejecting] = useState(false)

  const fetchOrgs = useCallback(async () => {
    const { data } = await adminApi.getOrganizations(orgTab)
    setOrganizations(data ?? [])
  }, [orgTab])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await fetchOrgs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load organizations')
    } finally {
      setLoading(false)
    }
  }, [fetchOrgs])

  useEffect(() => {
    void load()
  }, [orgTab, load])

  async function handleApprove(id: string) {
    const key = `org-${id}`
    if (action) return
    setAction(key)
    setMessage(null)
    try {
      await adminApi.approveOrganization(id)
      setMessage({ type: 'success', text: 'Approved successfully' })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setAction(null)
    }
  }

  function openReject(id: string) {
    setRejectTarget({ kind: 'org', id })
    setRejectOpen(true)
  }

  async function handleReject(reason: string) {
    if (!rejectTarget || rejecting) return
    setRejecting(true)
    setMessage(null)
    try {
      await adminApi.rejectOrganization(rejectTarget.id, reason)
      setMessage({ type: 'success', text: 'Rejected successfully' })
      setRejectOpen(false)
      setRejectTarget(null)
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setRejecting(false)
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
      await load()
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
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Restore failed' })
    } finally {
      setOrgRestoreLoading(false)
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
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setPermOrgLoading(false)
    }
  }

  const isBusy = (key: string) => action === key

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper-dim">Organizations</h1>
          <p className="mt-2 text-paper-dim/55">Review and manage organization requests.</p>
        </div>
        <TabBar active={orgTab} onChange={setOrgTab} />
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
          <span className="text-sm">Loading organizations…</span>
        </div>
      ) : (
        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
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
                          <button type="button" disabled={action !== null} onClick={() => void handleApprove(org.id)} className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60">
                            {isBusy(`org-${org.id}`) && <Spinner size={12} />}Approve
                          </button>
                          <button type="button" disabled={action !== null} onClick={() => openReject(org.id)} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
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
      )}

      <RejectModal open={rejectOpen} onReject={handleReject} onCancel={() => { setRejectOpen(false); setRejectTarget(null) }} loading={rejecting} />

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

      <PermanentDeleteModal
        open={permOrgModal.open}
        title="Permanently delete organization"
        subject={permOrgModal.org?.organizationName ?? ''}
        confirmName={permOrgModal.org?.organizationName ?? ''}
        loading={permOrgLoading}
        onConfirm={handlePermanentDeleteOrganization}
        onCancel={() => setPermOrgModal({ open: false, org: null })}
      />
    </div>
  )
}
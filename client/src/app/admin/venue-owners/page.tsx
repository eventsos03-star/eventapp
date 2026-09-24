'use client'

import { useCallback, useEffect, useState } from 'react'
import { Spinner } from '../../../components/Spinner'
import { adminApi } from '../../../lib/adminApi'
import type { VenueOwner } from '../../../types'
import { TabBar, STATUS_STYLES, type Message, type Tab } from '../../../components/admin/ui'
import { RejectModal, ConfirmDialog, PermanentDeleteModal } from '../../../components/admin/modals'

export default function AdminVenueOwnersPage() {
  const [venueOwners, setVenueOwners] = useState<VenueOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)

  const [venueTab, setVenueTab] = useState<Tab>('pending')
  const [action, setAction] = useState<string | null>(null)

  const [venueRestoreModal, setVenueRestoreModal] = useState<{ open: boolean; owner: VenueOwner | null }>({ open: false, owner: null })
  const [venueRestoreLoading, setVenueRestoreLoading] = useState(false)

  const [permVenueModal, setPermVenueModal] = useState<{ open: boolean; owner: VenueOwner | null }>({ open: false, owner: null })
  const [permVenueLoading, setPermVenueLoading] = useState(false)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<{ kind: 'venue'; id: string } | null>(null)
  const [rejecting, setRejecting] = useState(false)

  const fetchOwners = useCallback(async () => {
    const { data } = await adminApi.getVenueOwners(venueTab)
    setVenueOwners(data ?? [])
  }, [venueTab])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await fetchOwners()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load venue owners')
    } finally {
      setLoading(false)
    }
  }, [fetchOwners])

  useEffect(() => {
    void load()
  }, [venueTab, load])

  async function handleApprove(id: string) {
    const key = `venue-${id}`
    if (action) return
    setAction(key)
    setMessage(null)
    try {
      await adminApi.approveVenueOwner(id)
      setMessage({ type: 'success', text: 'Approved successfully' })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setAction(null)
    }
  }

  function openReject(id: string) {
    setRejectTarget({ kind: 'venue', id })
    setRejectOpen(true)
  }

  async function handleReject(_reason: string) {
    if (!rejectTarget || rejecting) return
    setRejecting(true)
    setMessage(null)
    try {
      await adminApi.rejectVenueOwner(rejectTarget.id)
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

  async function handleRestoreVenueOwner() {
    if (!venueRestoreModal.owner || venueRestoreLoading) return
    setVenueRestoreLoading(true)
    setMessage(null)
    try {
      await adminApi.restoreVenueOwner(venueRestoreModal.owner.ownerId)
      setMessage({ type: 'success', text: 'Venues restored' })
      setVenueRestoreModal({ open: false, owner: null })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Restore failed' })
    } finally {
      setVenueRestoreLoading(false)
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
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setPermVenueLoading(false)
    }
  }

  const isBusy = (key: string) => action === key

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper-dim">Venue Owners</h1>
          <p className="mt-2 text-paper-dim/55">Review and manage venue owner requests.</p>
        </div>
        <TabBar active={venueTab} onChange={setVenueTab} />
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
          <span className="text-sm">Loading venue owners…</span>
        </div>
      ) : (
        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
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
                      <button type="button" disabled={action !== null} onClick={() => void handleApprove(owner.ownerId)} className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60">
                        {isBusy(`venue-${owner.ownerId}`) && <Spinner size={12} />}Approve
                      </button>
                      <button type="button" disabled={action !== null} onClick={() => openReject(owner.ownerId)} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
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
      )}

      <RejectModal open={rejectOpen} onReject={handleReject} onCancel={() => { setRejectOpen(false); setRejectTarget(null) }} loading={rejecting} />

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
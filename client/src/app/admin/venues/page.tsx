'use client'

import { useCallback, useEffect, useState } from 'react'
import { Spinner } from '../../../components/Spinner'
import { adminApi } from '../../../lib/adminApi'
import type { Venue } from '../../../types'
import { STATUS_STYLES, type Message } from '../../../components/admin/ui'
import { RejectModal } from '../../../components/admin/modals'

const STATUS_TABS: { value: Venue['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'blocked', label: 'Blocked' },
]

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [tab, setTab] = useState<Venue['status'] | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)

  const [action, setAction] = useState<string | null>(null)

  const fetchVenues = useCallback(async () => {
    const { data } = await adminApi.getVenues(tab === 'all' ? undefined : tab)
    setVenues(data ?? [])
  }, [tab])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await fetchVenues()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load venues')
    } finally {
      setLoading(false)
    }
  }, [fetchVenues])

  useEffect(() => {
    void load()
  }, [tab, load])

  async function handleApprove(id: string) {
    if (action) return
    setAction(`approve-${id}`)
    setMessage(null)
    try {
      await adminApi.approveVenue(id)
      setMessage({ type: 'success', text: 'Venue approved' })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setAction(null)
    }
  }

  function openReject(id: string) {
    setRejectTarget(id)
    setRejectOpen(true)
  }

  async function handleReject(_reason: string) {
    if (!rejectTarget || rejecting) return
    setRejecting(true)
    setMessage(null)
    try {
      await adminApi.rejectVenue(rejectTarget)
      setMessage({ type: 'success', text: 'Venue rejected' })
      setRejectOpen(false)
      setRejectTarget(null)
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setRejecting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper-dim">Venues</h1>
          <p className="mt-2 text-paper-dim/55">Review and manage venue listings.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-paper-dim bg-ink-soft p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                tab === t.value
                  ? 'bg-amber text-ink'
                  : 'text-paper-dim/60 hover:text-paper-dim'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
          <span className="text-sm">Loading venues…</span>
        </div>
      ) : (
        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          {venues.length === 0 ? (
            <p className="text-sm text-ink/45">No {tab === 'all' ? '' : `${tab} `}venues found.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {venues.map((venue) => (
                <li key={venue._id} className="flex items-start justify-between gap-4 rounded-lg border border-paper-dim px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{venue.venueName}</span>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[venue.status]}`}>{venue.status}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink/45">
                      {venue.location.city} · ${venue.pricePerDay}/day · capacity {venue.capacity}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink/35">{venue.location.formattedAddress}</p>
                  </div>
                  {venue.status === 'pending' && (
                    <div className="flex shrink-0 gap-2">
                      <button type="button" disabled={action !== null} onClick={() => void handleApprove(venue._id)} className="flex items-center gap-2 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60">
                        {action === `approve-${venue._id}` && <Spinner size={12} />}Approve
                      </button>
                      <button type="button" disabled={action !== null} onClick={() => openReject(venue._id)} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                        Reject
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
    </div>
  )
}
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Spinner } from '../../../components/Spinner'
import { adminApi } from '../../../lib/adminApi'
import type { AdminEvent } from '../../../types'
import { EventTabBar, type EventTab, type Message } from '../../../components/admin/ui'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [eventTab, setEventTab] = useState<EventTab>('draft')
  const [eventAction, setEventAction] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)

  const fetchEvents = useCallback(async () => {
    const { data } = await adminApi.getAllEvents()
    setEvents(data ?? [])
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await fetchEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load events')
    } finally {
      setLoading(false)
    }
  }, [fetchEvents])

  useEffect(() => {
    void load()
  }, [load])

  async function handlePublishEvent(id: string) {
    if (eventAction) return
    setEventAction(id)
    setMessage(null)
    try {
      await adminApi.publishEvent(id)
      setMessage({ type: 'success', text: 'Event published' })
      await fetchEvents()
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
      await fetchEvents()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setEventAction(null)
    }
  }

  const filteredEvents = events.filter((e) => e.status === eventTab)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper-dim">Events</h1>
          <p className="mt-2 text-paper-dim/55">Review events and publish pending drafts.</p>
        </div>
        <EventTabBar active={eventTab} onChange={setEventTab} />
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
          <span className="text-sm">Loading events…</span>
        </div>
      ) : (
        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
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
      )}
    </div>
  )
}
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '../context/NotificationContext'
import type { Notification } from '../types'

function NotificationBody({ item }: { item: Notification }) {
  return (
    <>
      <p
        className={`truncate text-sm ${
          item.isRead ? 'text-paper-dim/70' : 'font-semibold text-paper-dim'
        }`}
      >
        {item.title}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs text-paper-dim/60">{item.message}</p>
      <p className="mt-1 text-[11px] text-paper-dim/40">
        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
      </p>
    </>
  )
}

export default function NotificationBell() {
  const { items, unreadCount, loading, markRead, markAllRead, remove } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-paper-dim transition hover:bg-white/10"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber px-1 text-[11px] font-bold text-ink">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-ink-line bg-ink-soft shadow-lg">
          <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
            <span className="text-sm font-semibold text-paper-dim">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-amber hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-paper-dim/50">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-paper-dim/50">No notifications yet</p>
            ) : (
              items.map((item) => (
                <div
                  key={item._id}
                  className={`group flex items-start gap-2 border-b border-ink-line/60 px-4 py-3 ${
                    item.isRead ? '' : 'bg-white/5'
                  }`}
                >
                  {item.link ? (
                    <Link
                      href={item.link}
                      onClick={() => {
                        void markRead(item._id)
                        setOpen(false)
                      }}
                      className="min-w-0 flex-1"
                    >
                      <NotificationBody item={item} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void markRead(item._id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <NotificationBody item={item} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Remove notification"
                    onClick={() => void remove(item._id)}
                    className="mt-0.5 rounded p-1 text-paper-dim/40 opacity-0 transition hover:text-paper-dim group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

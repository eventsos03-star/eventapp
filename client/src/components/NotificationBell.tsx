'use client'

import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../context/useNotifications'
import type { Notification } from '../lib/notificationApi'

// ── helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function typeIcon(type: Notification['type']): string {
  switch (type) {
    case 'organization': return '🏢'
    case 'venuBooking':  return '🏛️'
    case 'task':         return '✅'
    case 'team':         return '👥'
    default:             return '🔔'
  }
}

// ── component ────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleItemClick(n: Notification) {
    if (!n.isRead) await markRead(n._id)
  }

  return (
    <div ref={panelRef} className="relative" style={{ position: 'relative' }}>
      {/* ── Bell button ─────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px solid #333a4d',
          background: open ? '#1e2230' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
          color: '#e4d9c0',
        }}
      >
        {/* Bell SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread notifications`}
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '17px',
              height: '17px',
              borderRadius: '999px',
              background: '#e8a33d',
              color: '#14171f',
              fontSize: '10px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
              pointerEvents: 'none',
              border: '2px solid #12151D',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ──────────────────────────────── */}
      {open && (
        <div
          id="notification-panel"
          role="dialog"
          aria-label="Notifications panel"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: '360px',
            maxHeight: '480px',
            borderRadius: '14px',
            border: '1px solid #333a4d',
            background: '#1e2230',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'ntfSlideIn 0.18s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid #333a4d',
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 600, color: '#f1ead0', fontSize: '14px' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  background: '#e8a33d22',
                  color: '#e8a33d',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '999px',
                  border: '1px solid #e8a33d44',
                }}>
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  fontSize: '12px',
                  color: '#e8a33d',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  transition: 'background 0.15s',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#e8a33d22' }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
            {notifications.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                gap: '10px',
                color: '#6b7a99',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p style={{ margin: 0, fontSize: '13px' }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    background: n.isRead ? 'transparent' : '#14171f66',
                    border: 'none',
                    borderBottom: '1px solid #333a4d22',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#333a4d44' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.isRead ? 'transparent' : '#14171f66' }}
                >
                  {/* Icon bubble */}
                  <span style={{
                    flexShrink: 0,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#333a4d',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '16px',
                    marginTop: '1px',
                  }}>
                    {typeIcon(n.type)}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 2px',
                      fontSize: '13px',
                      fontWeight: n.isRead ? 400 : 600,
                      color: '#e4d9c0',
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {n.title}
                    </p>
                    <p style={{
                      margin: '0 0 4px',
                      fontSize: '12px',
                      color: '#6b7a99',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '11px', color: '#4a5568' }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <span style={{
                      flexShrink: 0,
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#e8a33d',
                      marginTop: '6px',
                    }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Slide-in animation */}
      <style>{`
        @keyframes ntfSlideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  )
}

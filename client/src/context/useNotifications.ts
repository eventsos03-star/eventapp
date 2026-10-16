'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { notificationApi, type Notification } from '../lib/notificationApi'
import { useAuth } from '../context/AuthContext'

const POLL_INTERVAL = 30_000 // 30 seconds

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await notificationApi.list(1, 20)
      if (data) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // silently fail — non-critical
    }
  }, [user])

  // Initial fetch + polling
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    void fetchNotifications()

    timerRef.current = setInterval(() => {
      void fetchNotifications()
    }, POLL_INTERVAL)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [user, fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    // optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    )
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await notificationApi.markRead(id)
    } catch {
      // revert on failure — simple refetch
      void fetchNotifications()
    }
  }, [fetchNotifications])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await notificationApi.markAllRead()
    } catch {
      void fetchNotifications()
    }
  }, [fetchNotifications])

  return { notifications, unreadCount, loading, markRead, markAllRead, refresh: fetchNotifications }
}

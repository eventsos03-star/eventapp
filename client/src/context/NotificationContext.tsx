'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'react-toastify'
import { useAuth } from './AuthContext'
import { notificationApi } from '../lib/notificationApi'
import type { Notification } from '../types'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000'

interface NotificationContextValue {
  items: Notification[]
  unreadCount: number
  loading: boolean
  connected: boolean
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth()
  const userId = user?.id ?? null

  const [items, setItems] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const renewingRef = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationApi.list(1, 20),
        notificationApi.unreadCount(),
      ])
      setItems(listRes.data?.items ?? [])
      setUnreadCount(countRes.data?.count ?? listRes.data?.unreadCount ?? 0)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [])

  useEffect(() => {
    if (initializing) return

    // Logged out: tear everything down.
    if (!userId) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setItems([])
      setUnreadCount(0)
      setConnected(false)
      return
    }

    let active = true

    async function connect() {
      try {
        const { data } = await notificationApi.socketTicket()
        const ticket = data?.ticket
        if (!active || !ticket) return

        const socket = io(SOCKET_URL, {
          auth: { ticket },
          withCredentials: true,
          transports: ['websocket', 'polling'],
        })
        socketRef.current = socket

        socket.on('connect', () => setConnected(true))
        socket.on('disconnect', () => setConnected(false))

        socket.on('notification:new', (notification: Notification) => {
          setItems((prev) => {
            if (prev.some((item) => item._id === notification._id)) return prev
            return [notification, ...prev]
          })
          if (!notification.isRead) setUnreadCount((count) => count + 1)
          toast.info(notification.title)
        })

        socket.on('connect_error', async () => {
          setConnected(false)
          // The 60s ticket may have expired; fetch a fresh one before the next retry.
          if (renewingRef.current) return
          renewingRef.current = true
          try {
            const { data: renewed } = await notificationApi.socketTicket()
            if (renewed?.ticket && socketRef.current) {
              socketRef.current.auth = { ticket: renewed.ticket }
            }
          } catch (error) {
            console.error('Failed to renew socket ticket:', error)
          } finally {
            setTimeout(() => {
              renewingRef.current = false
            }, 2000)
          }
        })
      } catch (error) {
        console.error('Failed to connect notification socket:', error)
      }
    }

    async function start() {
      setLoading(true)
      await refresh()
      if (active) setLoading(false)
      if (active) await connect()
    }

    void start()

    return () => {
      active = false
      socketRef.current?.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [userId, initializing, refresh])

  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((item) => item._id === id)
      if (target && !target.isRead) {
        setItems((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)))
        setUnreadCount((count) => Math.max(0, count - 1))
      }
      try {
        await notificationApi.markRead(id)
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
        await refresh()
      }
    },
    [items, refresh],
  )

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })))
    setUnreadCount(0)
    try {
      await notificationApi.markAllRead()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      await refresh()
    }
  }, [refresh])

  const remove = useCallback(
    async (id: string) => {
      const target = items.find((item) => item._id === id)
      setItems((prev) => prev.filter((item) => item._id !== id))
      if (target && !target.isRead) setUnreadCount((count) => Math.max(0, count - 1))
      try {
        await notificationApi.remove(id)
      } catch (error) {
        console.error('Failed to remove notification:', error)
        await refresh()
      }
    },
    [items, refresh],
  )

  const clearAll = useCallback(async () => {
    setItems([])
    setUnreadCount(0)
    try {
      await notificationApi.clearAll()
    } catch (error) {
      console.error('Failed to clear notifications:', error)
      await refresh()
    }
  }, [refresh])

  const value = useMemo(
    () => ({ items, unreadCount, loading, connected, markRead, markAllRead, remove, clearAll, refresh }),
    [items, unreadCount, loading, connected, markRead, markAllRead, remove, clearAll, refresh],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider')
  return context
}

'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './Spinner'

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initializing && user) router.replace('/profile')
  }, [initializing, user, router])

  if (initializing) {
    return (
      <div className="page-loader">
        <Spinner size={28} />
      </div>
    )
  }

  if (user) return null
  return <>{children}</>
}

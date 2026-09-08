'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './Spinner'

// Guards a page so only a logged-in platform admin can see it:
// - signed out       -> /login
// - signed in, USER  -> "Access denied" screen
// - signed in, ADMIN -> children
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initializing && !user) router.replace('/login')
  }, [initializing, user, router])

  if (initializing) {
    return (
      <div className="page-loader">
        <Spinner size={28} />
      </div>
    )
  }

  if (!user) return null

  if (user.role !== 'ADMIN') {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-5 font-sans text-paper-dim">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-semibold text-paper-dim">Access denied</h1>
          <p className="mt-2 text-sm text-paper-dim/55">
            You need an admin account to view this page.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/dashboard')}
            className="mt-6 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

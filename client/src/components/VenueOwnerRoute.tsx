'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Spinner } from './Spinner'

// Guards a page so only a logged-in venue owner (a user who owns >= 1 venue)
// can see it:
// - signed out          -> /login
// - signed in, no venue -> "No venues yet" screen
// - signed in, owns a venue -> children
export function VenueOwnerRoute({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth()
  const router = useRouter()
  const [ownsVenue, setOwnsVenue] = useState<boolean | null>(null)

  useEffect(() => {
    if (!initializing && !user) {
      router.replace('/login')
      return
    }
  }, [initializing, user, router])

  useEffect(() => {
    let active = true
    if (user) {
      api
        .getMyVenues()
        .then(({ data }) => {
          if (active) setOwnsVenue((data ?? []).length > 0)
        })
        .catch(() => {
          if (active) setOwnsVenue(false)
        })
    }
    return () => {
      active = false
    }
  }, [user])

  if (initializing || (user && ownsVenue === null)) {
    return (
      <div className="page-loader">
        <Spinner size={28} />
      </div>
    )
  }

  if (!user) return null

  if (!ownsVenue) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-5 font-sans text-paper-dim">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-semibold text-paper-dim">
            No venues yet
          </h1>
          <p className="mt-2 text-sm text-paper-dim/55">
            You need to own at least one venue to use the venue owner dashboard.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/venues')}
            className="mt-6 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep"
          >
            Browse venues
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

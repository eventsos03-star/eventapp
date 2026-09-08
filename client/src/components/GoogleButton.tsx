'use client'

import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../lib/google'

interface GoogleButtonProps {
  onCredential: (credential: string) => void | Promise<void>
  onError?: (message: string) => void
}

export function GoogleButton({ onCredential, onError }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const clientId: string = GOOGLE_CLIENT_ID

    let cancelled = false
    let attempts = 0

    const render = () => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id)
        return false

      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        callback: async (response) => {
          try {
            await onCredential(response.credential)
          } catch (error) {
            onError?.(
              error instanceof Error ? error.message : 'Google login failed',
            )
          }
        },
      })

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: containerRef.current.offsetWidth,
        text: 'continue_with',
      })

      setRendered(true)
      return true
    }

    const poll = setInterval(() => {
      if (render() || ++attempts > 33) clearInterval(poll)
    }, 300)

    render()

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [onCredential, onError])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="google-disabled">
        Google login is not configured. Set{' '}
        <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in <code>client/.env</code> to
        enable it.
      </p>
    )
  }

  return (
    <div
      ref={containerRef}
      className="google-button"
      data-rendered={rendered || undefined}
    />
  )
}

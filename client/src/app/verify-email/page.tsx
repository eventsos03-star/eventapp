'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { AuthShell } from '../../components/AuthShell'
import { Spinner } from '../../components/Spinner'

function VerifyEmailView() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token. Use the link from your email.')
      return
    }
    let active = true
    api
      .verifyEmail(token)
      .then((res) => {
        if (!active) return
        setStatus('success')
        setMessage(res.message)
      })
      .catch((err: unknown) => {
        if (!active) return
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Verification failed')
      })
    return () => {
      active = false
    }
  }, [token])

  return (
    <AuthShell
      title={status === 'loading' ? 'Verifying your email…' : status === 'success' ? 'Email verified' : 'Verification failed'}
      footer={
        <span>
          <Link href="/login">Go to sign in</Link>
        </span>
      }
    >
      {status === 'loading' && (
        <div className="page-loader">
          <Spinner size={28} />
        </div>
      )}
      {status === 'success' && <div className="alert alert-success">{message}</div>}
      {status === 'error' && <div className="alert alert-error">{message}</div>}
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="page-loader"><Spinner size={28} /></div>}>
      <VerifyEmailView />
    </Suspense>
  )
}

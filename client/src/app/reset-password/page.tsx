'use client'

import { Suspense, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { AuthShell } from '../../components/AuthShell'
import { Field } from '../../components/Field'
import { Spinner } from '../../components/Spinner'

function ResetPasswordView() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!token) {
      setError('Missing reset token. Use the link from your email.')
      return
    }

    setSubmitting(true)
    try {
      await api.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <AuthShell
        title="Password reset"
        subtitle="Your password has been updated and all your sessions were signed out."
        footer={
          <span>
            <Link href="/login">Sign in with your new password</Link>
          </span>
        }
      >
        <div className="alert alert-success">Password reset successfully.</div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before"
      footer={
        <span>
          Changed your mind? <Link href="/login">Sign in</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="form" noValidate>
        {error && <div className="alert alert-error">{error}</div>}
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        <Field
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Spinner /> : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="page-loader"><Spinner size={28} /></div>}>
      <ResetPasswordView />
    </Suspense>
  )
}

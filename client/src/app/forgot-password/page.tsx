'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { AuthShell } from '../../components/AuthShell'
import { Field } from '../../components/Field'
import { Spinner } from '../../components/Spinner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.forgotPassword(email)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="If an account exists for that email, a password reset link is on its way. It expires in 30 minutes."
        footer={
          <span>
            <Link href="/login">Back to sign in</Link>
          </span>
        }
      >
        <div className="alert alert-success">Reset link sent. Please check your email.</div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <span>
          Remembered it? <Link href="/login">Sign in</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="form" noValidate>
        {error && <div className="alert alert-error">{error}</div>}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Spinner /> : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  )
}

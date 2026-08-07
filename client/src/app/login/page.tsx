'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GuestRoute } from '../../components/GuestRoute'
import { AuthShell } from '../../components/AuthShell'
import { Field } from '../../components/Field'
import { GoogleButton } from '../../components/GoogleButton'
import { Spinner } from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'

function LoginForm() {
  const { login, loginWithGoogle } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password })
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleCredential(credential: string) {
    await loginWithGoogle(credential)
    router.push('/dashboard')
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your EventOS account"
      footer={
        <>
          <span>
            Don't have an account? <Link href="/register">Create one</Link>
          </span>
          <Link href="/forgot-password">Forgot password?</Link>
        </>
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
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Spinner /> : 'Sign in'}
        </button>
      </form>

      <div className="divider">
        <span>or</span>
      </div>

      <GoogleButton onCredential={handleGoogleCredential} onError={(message) => setError(message)} />
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <GuestRoute>
      <LoginForm />
    </GuestRoute>
  )
}

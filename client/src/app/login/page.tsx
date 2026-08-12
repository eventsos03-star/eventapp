'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'

let googleInitialized = false

function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (credential: string) => void
  onError: (message: string) => void
}) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const onCredentialRef = useRef(onCredential)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onCredentialRef.current = onCredential
    onErrorRef.current = onError
  })

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return

    let cancelled = false
    let attempts = 0

    const render = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return false

      if (!googleInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              onCredentialRef.current(response.credential)
            } else {
              onErrorRef.current('Google sign-in did not return a credential')
            }
          },
        })
        googleInitialized = true
      }

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
      })

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
  }, [])

  return <div ref={buttonRef} className="flex justify-center" />
}

function EventOpsHeroPanel() {
  const activityData = [
    { time: '09 AM', height: 30 },
    { time: '10 AM', height: 55 },
    { time: '11 AM', height: 85 },
    { time: '12 PM', height: 60 },
    { time: '01 PM', height: 40 },
    { time: '02 PM', height: 95 },
    { time: '03 PM', height: 70 },
  ]

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#090d16] p-6 sm:p-10 lg:p-12 text-white">
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 backdrop-blur-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Live Event Command Center
        </span>

        <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Complete control over <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
            every live experience
          </span>
        </h2>
        <p className="mt-3 sm:mt-4 max-w-md text-xs sm:text-sm text-slate-400 leading-relaxed">
          Manage venue bookings, real-time QR attendance, organizing team tasks, and instant post-event certifications from one central hub.
        </p>
      </div>

      <div className="relative z-10 my-6 sm:my-8 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] sm:text-xs font-medium text-slate-400">Peak Venue Check-ins</div>
              <div className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 sm:mt-1">2,840 Attendees</div>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-amber-400 border border-amber-500/20">
              ⚡ 98.4% Scan Speed
            </span>
          </div>

          <div className="mt-6 sm:mt-8 flex items-end justify-between gap-2 sm:gap-3 h-28 sm:h-32 px-1">
            {activityData.map((item) => (
              <div key={item.time} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-300 group-hover:brightness-125 origin-bottom"
                  style={{ height: `${item.height}%` }}
                />
                <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 truncate max-w-full">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-3.5 sm:p-4 backdrop-blur-xl">
            <div className="text-[11px] sm:text-xs text-slate-400">Confirmed Venues</div>
            <div className="mt-1 text-base sm:text-xl font-bold text-white">18 Halls Booked</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-3.5 sm:p-4 backdrop-blur-xl">
            <div className="text-[11px] sm:text-xs text-slate-400">Certificates Issued</div>
            <div className="mt-1 text-base sm:text-xl font-bold text-amber-400">1,450 Auto-Sent</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const { login, loginWithGoogle } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    try {
      await loginWithGoogle(credential)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans antialiased">
      {/* LEFT HALF: Form & Auth */}
      <div className="flex w-full flex-col justify-between px-5 py-6 sm:px-10 sm:py-10 lg:w-1/2 lg:px-16 xl:px-24 min-h-screen lg:min-h-0">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base sm:text-lg shadow-md">
            E
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
            Event<span className="text-amber-500">OS</span>
          </span>
        </div>

        {/* Center Main Login Section */}
        <div className="my-auto py-6 sm:py-8 w-full max-w-md mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">
            Enter your credentials to manage your events &amp; venues
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 sm:mt-8 space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-amber-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.02 10.02 0 012.122-.132c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-1.522 1.522L3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
              ) : (
                <>Sign In &rarr;</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 sm:my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* SSO and Outline Button */}
          <div className="space-y-3">
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={(message) => setError(message)}
            />

            <Link
              href="/register"
              className="flex w-full items-center justify-center rounded-xl border border-slate-900 py-2.5 sm:py-3 text-sm font-semibold text-slate-900 hover:bg-slate-900 hover:text-white transition"
            >
              Create New Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center text-xs text-slate-500">
          New to EventOS? Discover how to manage venues &amp; events
        </div>
      </div>

      {/* RIGHT HALF: Live Event Operations Showcase */}
      <div className="w-full lg:w-1/2">
        <EventOpsHeroPanel />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginForm />
}
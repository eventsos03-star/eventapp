'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { GuestRoute } from '../../components/GuestRoute'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

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
          Join the teams running <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
            flawless live events
          </span>
        </h2>
        <p className="mt-3 sm:mt-4 max-w-md text-xs sm:text-sm text-slate-400 leading-relaxed">
          Manage venue bookings, real-time QR attendance, organizing team tasks,
          and instant post-event certifications from one central hub.
        </p>
      </div>

      <div className="relative z-10 my-6 sm:my-8 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] sm:text-xs font-medium text-slate-400">
                Peak Venue Check-ins
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 sm:mt-1">
                2,840 Attendees
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-amber-400 border border-amber-500/20">
              ⚡ 98.4% Scan Speed
            </span>
          </div>

          <div className="mt-6 sm:mt-8 flex items-end justify-between gap-2 sm:gap-3 h-28 sm:h-32 px-1">
            {activityData.map((item) => (
              <div
                key={item.time}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
              >
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
            <div className="text-[11px] sm:text-xs text-slate-400">
              Confirmed Venues
            </div>
            <div className="mt-1 text-base sm:text-xl font-bold text-white">
              18 Halls Booked
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-3.5 sm:p-4 backdrop-blur-xl">
            <div className="text-[11px] sm:text-xs text-slate-400">
              Certificates Issued
            </div>
            <div className="mt-1 text-base sm:text-xl font-bold text-amber-400">
              1,450 Auto-Sent
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function inputClass() {
  return 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
}

function RegisterForm() {
  const { register } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  async function handleResend() {
    setResending(true)
    setResendMessage(null)
    try {
      await api.resendVerification(email)
      setResendMessage('A new verification link has been sent.')
    } catch (err) {
      setResendMessage(
        err instanceof Error
          ? err.message
          : 'Could not resend the verification email',
      )
    } finally {
      setResending(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await register({ firstName, lastName, email, password })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans antialiased">
      {/* LEFT HALF: Form */}
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

        {/* Center Section */}
        <div className="my-auto py-6 sm:py-8 w-full max-w-md mx-auto">
          {done ? (
            <>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Check your inbox
              </h1>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">
                We sent a verification link to{' '}
                <span className="font-semibold text-slate-700">{email}</span>.
                Click it to activate your account, then sign in.
              </p>

              <div className="mt-6 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                Your account has been created. You&apos;ll be able to sign in as
                soon as your email is verified.
              </div>

              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resending}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                {resending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                )}
                Resend verification email
              </button>
              {resendMessage && (
                <p className="mt-3 text-center text-xs text-slate-600">
                  {resendMessage}
                </p>
              )}

              <Link
                href="/login"
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99]"
              >
                Go to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Create your account
              </h1>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">
                Join EventOS in under a minute
              </p>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-6 sm:mt-8 space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      First name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Last name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      autoComplete="family-name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className={inputClass()}
                    />
                  </div>
                </div>

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
                    placeholder="you@example.com"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputClass()}
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Use at least 8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className={inputClass()}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs sm:text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-amber-600 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
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

export default function RegisterPage() {
  return (
    <GuestRoute>
      <RegisterForm />
    </GuestRoute>
  )
}

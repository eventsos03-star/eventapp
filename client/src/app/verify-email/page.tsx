'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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

function StatusIcon({ status }: { status: 'loading' | 'success' | 'error' }) {
  if (status === 'loading') {
    return (
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
    )
  }
  if (status === 'success') {
    return (
      <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100">
        <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  return (
    <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100">
      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  )
}

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

  const title =
    status === 'loading' ? 'Verifying your email…' : status === 'success' ? 'Email verified' : 'Verification failed'

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans antialiased">
      {/* LEFT HALF: Status */}
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
        <div className="my-auto py-6 sm:py-8 w-full max-w-md mx-auto text-center sm:text-left">
          <div className="mb-5 flex justify-center sm:justify-start">
            <StatusIcon status={status} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>

          {status === 'success' && (
            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
              {message}
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {message}
            </div>
          )}

          {status !== 'loading' && (
            <Link
              href="/login"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99]"
            >
              Go to sign in
            </Link>
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

function PageLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VerifyEmailView />
    </Suspense>
  )
}
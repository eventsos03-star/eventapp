'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '../../../lib/api'

type PaymentPolicy = 'fullpayment' | 'advanceAllowed' | 'payAfterEvent'

function inputClass() {
  return 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
}

function labelClass() {
  return 'mb-1.5 block text-xs font-semibold text-slate-700'
}

function errorTextClass() {
  return 'mt-1 text-xs font-medium text-red-600'
}

export default function NewVenuePage() {
  const router = useRouter()

  // Same pattern as the venues list page: avoid a flash/race by tracking
  // 'checking' -> 'authed' | 'guest' explicitly instead of trusting useAuth() alone.
  const [authStatus, setAuthStatus] = useState<'checking' | 'authed' | 'guest'>('checking')

  const [venueName, setVenueName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [state, setState] = useState('')
  const [capacity, setCapacity] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [bookingPaymentPolicy, setBookingPaymentPolicy] = useState<PaymentPolicy | ''>('')
  const [advancePercentage, setAdvancePercentage] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .me()
      .then(() => {
        if (!cancelled) setAuthStatus('authed')
      })
      .catch(() => {
        if (!cancelled) setAuthStatus('guest')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (authStatus === 'guest') {
      router.replace('/login')
    }
  }, [authStatus, router])

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}

    if (!venueName.trim()) errs.venueName = 'Venue name is required.'
    if (!description.trim()) errs.description = 'Description is required.'
    if (!city.trim()) errs.city = 'City is required.'
    if (!state.trim()) errs.state = 'State is required.'

    if (!capacity || Number.isNaN(Number(capacity)) || Number(capacity) <= 0) {
      errs.capacity = 'Enter a valid capacity.'
    }

    if (!pricePerDay || Number.isNaN(Number(pricePerDay)) || Number(pricePerDay) < 0) {
      errs.pricePerDay = 'Enter a valid price.'
    }

    if (!bookingPaymentPolicy) {
      errs.bookingPaymentPolicy = 'Select a booking payment policy.'
    }

    if (bookingPaymentPolicy === 'advanceAllowed') {
      const pct = Number(advancePercentage)
      if (!advancePercentage.trim() || Number.isNaN(pct) || pct <= 0 || pct > 100) {
        errs.advancePercentage = 'Enter an advance percentage between 1 and 100.'
      }
    }

    return errs
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const { data } = await api.createVenue({
        venueName: venueName.trim(),
        description: description.trim(),
        location: {
          city: city.trim(),
          address: address.trim(),
          state: state.trim(),
        },
        capacity: Number(capacity),
        pricePerDay: Number(pricePerDay),
        bookingPaymentPolicy: bookingPaymentPolicy as PaymentPolicy,
        ...(bookingPaymentPolicy === 'advanceAllowed'
          ? { advancePercentage: Number(advancePercentage) }
          : {}),
        // Schema wants [{ url, publicId }]. Until real image uploads are
        // wired up, the pasted URL is used for both fields.
        images: imageUrl.trim()
          ? [{ url: imageUrl.trim(), publicId: imageUrl.trim() }]
          : [],
      })
      router.push('/venues')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create venue.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authStatus === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking your session…</p>
      </div>
    )
  }

  if (authStatus === 'guest') {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base shadow-md">
              E
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-950">
              Event<span className="text-amber-500">OS</span>
            </span>
          </Link>

          <Link
            href="/venues"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← All Venues
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-10 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Add Venue
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Submit a venue for listing. New venues start as pending.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6"
        >
          <div className="sm:col-span-2">
            <label className={labelClass()}>Venue name</label>
            <input value={venueName} onChange={(e) => setVenueName(e.target.value)} className={inputClass()} />
            {fieldErrors.venueName && <p className={errorTextClass()}>{fieldErrors.venueName}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass()}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What makes this venue a good fit for events?"
              className={inputClass()}
            />
            {fieldErrors.description && <p className={errorTextClass()}>{fieldErrors.description}</p>}
          </div>

          <div>
            <label className={labelClass()}>City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kochi"
              className={inputClass()}
            />
            {fieldErrors.city && <p className={errorTextClass()}>{fieldErrors.city}</p>}
          </div>

          <div>
            <label className={labelClass()}>State</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Kerala"
              className={inputClass()}
            />
            {fieldErrors.state && <p className={errorTextClass()}>{fieldErrors.state}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass()}>Address (optional)</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass()} />
          </div>

          <div>
            <label className={labelClass()}>Capacity</label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className={inputClass()}
            />
            {fieldErrors.capacity && <p className={errorTextClass()}>{fieldErrors.capacity}</p>}
          </div>

          <div>
            <label className={labelClass()}>Price per day (₹)</label>
            <input
              type="number"
              min={0}
              value={pricePerDay}
              onChange={(e) => setPricePerDay(e.target.value)}
              className={inputClass()}
            />
            {fieldErrors.pricePerDay && <p className={errorTextClass()}>{fieldErrors.pricePerDay}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass()}>Booking payment policy</label>
            <select
              value={bookingPaymentPolicy}
              onChange={(e) => setBookingPaymentPolicy(e.target.value as PaymentPolicy)}
              className={inputClass()}
            >
              <option value="">Select a policy…</option>
              <option value="fullpayment">Full payment upfront</option>
              <option value="advanceAllowed">Advance allowed</option>
              <option value="payAfterEvent">Pay after event</option>
            </select>
            {fieldErrors.bookingPaymentPolicy && (
              <p className={errorTextClass()}>{fieldErrors.bookingPaymentPolicy}</p>
            )}
          </div>

          {bookingPaymentPolicy === 'advanceAllowed' && (
            <div className="sm:col-span-2">
              <label className={labelClass()}>Advance percentage</label>
              <input
                type="number"
                min={1}
                max={100}
                value={advancePercentage}
                onChange={(e) => setAdvancePercentage(e.target.value)}
                placeholder="e.g. 30"
                className={inputClass()}
              />
              {fieldErrors.advancePercentage && (
                <p className={errorTextClass()}>{fieldErrors.advancePercentage}</p>
              )}
            </div>
          )}

          <div className="sm:col-span-2">
            <label className={labelClass()}>Image URL (optional)</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputClass()} />
          </div>

          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Adding…' : 'Add Venue'}
            </button>
            <Link
              href="/venues"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
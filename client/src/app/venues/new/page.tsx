'use client'

import { useEffect, useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '../../../lib/api'
import type { VenueLocation } from '../../../types'
import LocationPicker from '../../../components/maps/LocationPicker'

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

  const [authStatus, setAuthStatus] = useState<'checking' | 'authed' | 'guest'>('checking')

  const [venueName, setVenueName] = useState('')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [bookingPaymentPolicy, setBookingPaymentPolicy] = useState<PaymentPolicy | ''>('')
  const [advancePercentage, setAdvancePercentage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [location, setLocation] = useState<VenueLocation | null>(null)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.me().then(() => {
      if (!cancelled) setAuthStatus('authed')
    }).catch(() => {
      if (!cancelled) setAuthStatus('guest')
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (authStatus === 'guest') router.replace('/login')
  }, [authStatus, router])

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}

    if (!venueName.trim()) errs.venueName = 'Venue name is required.'
    if (!description.trim()) errs.description = 'Description is required.'

    if (!location || !location.coordinates || (location.coordinates[0] === 0 && location.coordinates[1] === 0)) {
      errs.location = 'Please select a venue location on the map.'
    }

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

  const handleLocationChange = useCallback((loc: VenueLocation) => {
    setLocation(loc)
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.location
      return next
    })
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    if (!location) return

    setSubmitting(true)
    try {
      await api.createVenue({
        venueName: venueName.trim(),
        description: description.trim(),
        location,
        capacity: Number(capacity),
        pricePerDay: Number(pricePerDay),
        bookingPaymentPolicy: bookingPaymentPolicy as PaymentPolicy,
        ...(bookingPaymentPolicy === 'advanceAllowed'
          ? { advancePercentage: Number(advancePercentage) }
          : {}),
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
        <p className="text-sm text-slate-500">Checking your session...</p>
      </div>
    )
  }

  if (authStatus === 'guest') return null

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base shadow-md">E</div>
            <span className="text-lg font-bold tracking-tight text-slate-950">
              Event<span className="text-amber-500">OS</span>
            </span>
          </Link>
          <Link href="/venues" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            &larr; All Venues
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-10 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Add Venue</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Submit a venue for listing. New venues start as pending.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div>
            <label className={labelClass()}>Venue name</label>
            <input value={venueName} onChange={(e) => setVenueName(e.target.value)} className={inputClass()} />
            {fieldErrors.venueName && <p className={errorTextClass()}>{fieldErrors.venueName}</p>}
          </div>

          <div>
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

          <LocationPicker value={location} onChange={handleLocationChange} error={fieldErrors.location} />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Capacity</label>
              <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputClass()} />
              {fieldErrors.capacity && <p className={errorTextClass()}>{fieldErrors.capacity}</p>}
            </div>

            <div>
              <label className={labelClass()}>Price per day (INR)</label>
              <input type="number" min={0} value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} className={inputClass()} />
              {fieldErrors.pricePerDay && <p className={errorTextClass()}>{fieldErrors.pricePerDay}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass()}>Booking payment policy</label>
            <select
              value={bookingPaymentPolicy}
              onChange={(e) => setBookingPaymentPolicy(e.target.value as PaymentPolicy)}
              className={inputClass()}
            >
              <option value="">Select a policy...</option>
              <option value="fullpayment">Full payment upfront</option>
              <option value="advanceAllowed">Advance allowed</option>
              <option value="payAfterEvent">Pay after event</option>
            </select>
            {fieldErrors.bookingPaymentPolicy && <p className={errorTextClass()}>{fieldErrors.bookingPaymentPolicy}</p>}
          </div>

          {bookingPaymentPolicy === 'advanceAllowed' && (
            <div>
              <label className={labelClass()}>Advance percentage</label>
              <input
                type="number" min={1} max={100}
                value={advancePercentage}
                onChange={(e) => setAdvancePercentage(e.target.value)}
                placeholder="e.g. 30"
                className={inputClass()}
              />
              {fieldErrors.advancePercentage && <p className={errorTextClass()}>{fieldErrors.advancePercentage}</p>}
            </div>
          )}

          <div>
            <label className={labelClass()}>Image URL (optional)</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className={inputClass()} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Adding...' : 'Add Venue'}
            </button>
            <Link href="/venues" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}

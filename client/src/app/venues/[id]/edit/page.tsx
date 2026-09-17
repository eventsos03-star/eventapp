'use client'

import { useEffect, useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api, ApiError } from '../../../../lib/api'
import type { Venue, VenueLocation } from '../../../../types'
import LocationPicker from '../../../../components/maps/LocationPicker'

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

export default function EditVenuePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [authStatus, setAuthStatus] = useState<'checking' | 'authed' | 'guest'>('checking')
  const [loading, setLoading] = useState(true)
  const [venue, setVenue] = useState<Venue | null>(null)

  const [venueName, setVenueName] = useState('')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [bookingPaymentPolicy, setBookingPaymentPolicy] = useState<PaymentPolicy | ''>('')
  const [advancePercentage, setAdvancePercentage] = useState('')
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

  useEffect(() => {
    if (authStatus !== 'authed' || !id) return
    let cancelled = false
    api.getVenue(id).then(({ data }) => {
      if (cancelled) return
      const v = data as Venue
      setVenue(v)
      setVenueName(v.venueName || '')
      setDescription(v.description || '')
      setCapacity(v.capacity ? String(v.capacity) : '')
      setPricePerDay(v.pricePerDay ? String(v.pricePerDay) : '')
      setBookingPaymentPolicy(v.bookingPaymentPolicy || '')
      setAdvancePercentage(v.advancePercentage ? String(v.advancePercentage) : '')
      setLocation(v.location ?? null)
      setLoading(false)
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof ApiError ? err.message : 'Could not load venue.')
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [authStatus, id])

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!venueName.trim()) errs.venueName = 'Venue name is required.'
    if (!description.trim()) errs.description = 'Description is required.'
    if (!capacity || Number.isNaN(Number(capacity)) || Number(capacity) <= 0) {
      errs.capacity = 'Enter a valid capacity.'
    }
    if (!pricePerDay || Number.isNaN(Number(pricePerDay)) || Number(pricePerDay) < 0) {
      errs.pricePerDay = 'Enter a valid price.'
    }
    if (!bookingPaymentPolicy) errs.bookingPaymentPolicy = 'Select a booking payment policy.'
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
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      await api.updateVenue(id, {
        venueName: venueName.trim(),
        description: description.trim(),
        capacity: capacity ? Number(capacity) : undefined,
        pricePerDay: pricePerDay ? Number(pricePerDay) : undefined,
        bookingPaymentPolicy: bookingPaymentPolicy as PaymentPolicy,
        advancePercentage: bookingPaymentPolicy === 'advanceAllowed' && advancePercentage
          ? Number(advancePercentage)
          : undefined,
        location: location ?? undefined,
      })
      router.push(`/venues/${id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update venue.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authStatus === 'checking' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading venue...</p>
      </div>
    )
  }

  if (authStatus === 'guest') return null

  if (error && !venue) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">
          <Link href="/profile" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base shadow-md">E</div>
            <span className="text-lg font-bold tracking-tight text-slate-950">
              Event<span className="text-amber-500">OS</span>
            </span>
          </Link>
          <Link href={`/venues/${id}`} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            &larr; Back to Venue
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-10 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Edit Venue</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Update your venue details and location.
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
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass()} />
            {fieldErrors.description && <p className={errorTextClass()}>{fieldErrors.description}</p>}
          </div>

          <LocationPicker value={location} onChange={handleLocationChange} />

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
              <input type="number" min={1} max={100} value={advancePercentage} onChange={(e) => setAdvancePercentage(e.target.value)} placeholder="e.g. 30" className={inputClass()} />
              {fieldErrors.advancePercentage && <p className={errorTextClass()}>{fieldErrors.advancePercentage}</p>}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href={`/venues/${id}`} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}

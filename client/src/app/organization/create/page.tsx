'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { Spinner } from '../../../components/Spinner'
import { useAuth } from '../../../context/AuthContext'
import { organizationApi } from '../../../lib/organizationApi'
import type { OrganizationType } from '../../../types'

const ORG_TYPES: { value: OrganizationType; label: string }[] = [
  { value: 'college', label: 'College / University' },
  { value: 'company', label: 'Company' },
  { value: 'startup', label: 'Startup' },
  { value: 'ngo', label: 'NGO' },
  { value: 'community', label: 'Community' },
  { value: 'event_org', label: 'Event Organization' },
  { value: 'other', label: 'Other' },
]

function inputClass() {
  return 'rounded-lg border border-paper-dim bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30'
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
              i + 1 <= step
                ? 'bg-amber text-ink'
                : 'border border-paper-dim text-ink/40'
            }`}
          >
            {i + 1}
          </span>
          {i < total - 1 && (
            <div
              className={`h-px w-8 ${i + 1 < step ? 'bg-amber' : 'bg-paper-dim'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function CreateContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    organizationName: '',
    organizationType: '' as OrganizationType | '',
    description: '',
    email: user?.email ?? '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validateStep1() {
    if (!form.organizationName.trim()) return 'Organization name is required'
    if (!form.organizationType) return 'Organization type is required'
    return null
  }

  function validateStep2() {
    if (!form.email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Valid email is required'
    return null
  }

  function handleNext() {
    setError(null)
    if (step === 1) {
      const err = validateStep1()
      if (err) {
        setError(err)
        return
      }
    } else if (step === 2) {
      const err = validateStep2()
      if (err) {
        setError(err)
        return
      }
    }
    setStep((s) => Math.min(s + 1, 3))
  }

  function handleBack() {
    setError(null)
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await organizationApi.create({
        organizationName: form.organizationName.trim(),
        organizationType: form.organizationType as OrganizationType,
        description: form.description || undefined,
        email: form.email.trim(),
        phoneNumber: form.phoneNumber || undefined,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
      })
      router.push('/organization')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create organization',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-paper-dim">
      <nav className="flex items-center justify-between border-b border-ink-line px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">
            E
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">
            EventOS
          </span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-paper-dim/70 transition hover:text-paper-dim"
        >
          Dashboard
        </Link>
      </nav>

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-12 sm:px-10">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-paper-dim">
            Create Organization
          </h1>
          <p className="mt-2 text-paper-dim/55">
            Set up your organization to start managing events.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <StepIndicator step={step} total={3} />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-8">
          <span
            className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink"
            aria-hidden="true"
          />

          {step === 1 && (
            <>
              <h2 className="mb-1 font-display text-xl font-semibold text-ink">
                Organization Identity
              </h2>
              <p className="mb-6 text-sm text-ink/45">
                Tell us about your organization.
              </p>
              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">
                    ORGANIZATION NAME *
                  </span>
                  <input
                    required
                    value={form.organizationName}
                    onChange={(e) =>
                      updateField('organizationName', e.target.value)
                    }
                    placeholder="e.g. TechFest University"
                    className={inputClass()}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">
                    ORGANIZATION TYPE *
                  </span>
                  <select
                    required
                    value={form.organizationType}
                    onChange={(e) =>
                      updateField('organizationType', e.target.value)
                    }
                    className={inputClass()}
                  >
                    <option value="">Select type</option>
                    {ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">
                    DESCRIPTION
                  </span>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Brief description of your organization"
                    className={inputClass()}
                  />
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="mb-1 font-display text-xl font-semibold text-ink">
                Contact Information
              </h2>
              <p className="mb-6 text-sm text-ink/45">
                How can people reach your organization?
              </p>
              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">
                    OFFICIAL EMAIL *
                  </span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="contact@organization.com"
                    className={inputClass()}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">
                    PHONE NUMBER
                  </span>
                  <input
                    value={form.phoneNumber}
                    onChange={(e) => updateField('phoneNumber', e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputClass()}
                  />
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-1 font-display text-xl font-semibold text-ink">
                Organization Address
              </h2>
              <p className="mb-6 text-sm text-ink/45">
                Where is your organization located?
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">
                    STREET ADDRESS
                  </span>
                  <input
                    value={form.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    placeholder="123 Main Street"
                    className={inputClass()}
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">
                      CITY
                    </span>
                    <input
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Mumbai"
                      className={inputClass()}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">
                      STATE
                    </span>
                    <input
                      value={form.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="Maharashtra"
                      className={inputClass()}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">
                      POSTAL CODE
                    </span>
                    <input
                      value={form.postalCode}
                      onChange={(e) =>
                        updateField('postalCode', e.target.value)
                      }
                      placeholder="400001"
                      className={inputClass()}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">
                      COUNTRY
                    </span>
                    <input
                      value={form.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className={inputClass()}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Spinner size={16} />}
                  Create Organization
                </button>
              </form>
            </>
          )}

          {step < 3 && (
            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:bg-amber-deep"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function CreateOrganizationPage() {
  return (
    <ProtectedRoute>
      <CreateContent />
    </ProtectedRoute>
  )
}

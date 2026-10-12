'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { api } from '../../../lib/api'

function VenueOwnerRegisterContent() {
  const router = useRouter()

  const [form, setForm] = useState({
    ownerName: '',
    phone: '',
    alternativePhone: '',
    email: '',
    address: '',
    managerName: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
 
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

 async function handleSubmit(event: React.FormEvent) {
  event.preventDefault()

  setError(null)
  
  setLoading(true)

  try {
    await api.applyVenueOwner(form)

    setShowSuccessModal(true)
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Could not submit your application.'
    )
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="min-h-screen bg-[#090d16] text-[#eee6d4]">
      
{showSuccessModal && (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-[#293241] bg-[#0c121e] p-7 text-center shadow-2xl">

      {/* Success Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-xl font-bold text-[#07110b]">
          ✓
        </div>
      </div>

      {/* Title */}
      <h2 className="mt-5 text-xl font-bold text-white">
        Application Submitted
      </h2>

      {/* Message */}
      <p className="mt-3 text-sm leading-6 text-[#8f9bad]">
        Your venue owner application has been submitted successfully.
        Please wait while the EventOS admin team reviews your application.
      </p>

      {/* Status */}
      <div className="mt-5 rounded-xl border border-[#303947] bg-[#111824] px-4 py-3">
        <p className="text-xs uppercase tracking-wider text-[#6f7b8d]">
          Application Status
        </p>

        <p className="mt-1 text-sm font-semibold text-[#f2a932]">
          Pending Admin Approval
        </p>
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={() => router.push('/profile')}
        className="mt-6 w-full rounded-xl bg-[#f2a932] px-5 py-3 text-sm font-bold text-[#11141c] transition hover:bg-[#ffb83f]"
      >
        Back to Profile
      </button>
    </div>
  </div>
)}
      {/* Main content */}
      <main className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          
<div className="mb-8">

  <div className="mb-6 flex items-center justify-between">

    
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f2a932] text-lg font-bold text-[#11141c]">
        E
      </div>

      <p className="text-sm font-semibold text-white">
        Event<span className="text-[#f2a932]">OS</span>
      </p>
    </div>

    
    <button
      type="button"
      onClick={() => router.push('/profile')}
      className="text-sm font-medium text-[#8994a8] transition hover:text-[#f2a932]"
    >
      ← Back to Profile
    </button>

  </div>

  {/* Page Title */}
  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
    Become a Venue Owner
  </h1>

  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8994a8] sm:text-base">
    Register your venue ownership details and submit an application
    for admin approval.
  </p>

</div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

         

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#252d3a] bg-[#0c121e] p-6 shadow-2xl sm:p-8"
          >
            {/* Section title */}
            <div className="mb-7 border-b border-[#202936] pb-5">
              <h2 className="text-lg font-semibold text-white">
                Venue Owner Information
              </h2>

              <p className="mt-1 text-sm text-[#718096]">
                Please provide the details required for your venue owner
                application.
              </p>
            </div>

            <div className="space-y-6">
              {/* Owner Name */}
              <div>
                <label
                  htmlFor="ownerName"
                  className="mb-2 block text-sm font-medium text-[#c7ceda]"
                >
                  Owner Name
                </label>

                <input
                  id="ownerName"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  required
                  placeholder="Enter owner name"
                  className="w-full rounded-xl border border-[#252d3a] bg-[#090d16] px-4 py-3 text-sm text-white placeholder:text-[#566174] outline-none transition focus:border-[#f2a932] focus:ring-1 focus:ring-[#f2a932]/30"
                />
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-[#c7ceda]"
                  >
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    type="tel"
                    placeholder="Enter phone number"
                    className="w-full rounded-xl border border-[#252d3a] bg-[#090d16] px-4 py-3 text-sm text-white placeholder:text-[#566174] outline-none transition focus:border-[#f2a932] focus:ring-1 focus:ring-[#f2a932]/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="alternativePhone"
                    className="mb-2 block text-sm font-medium text-[#c7ceda]"
                  >
                    Alternative Phone
                  </label>

                  <input
                    id="alternativePhone"
                    name="alternativePhone"
                    value={form.alternativePhone}
                    onChange={handleChange}
                    required
                    type="tel"
                    placeholder="Enter alternative number"
                    className="w-full rounded-xl border border-[#252d3a] bg-[#090d16] px-4 py-3 text-sm text-white placeholder:text-[#566174] outline-none transition focus:border-[#f2a932] focus:ring-1 focus:ring-[#f2a932]/30"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#c7ceda]"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  type="email"
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-[#252d3a] bg-[#090d16] px-4 py-3 text-sm text-white placeholder:text-[#566174] outline-none transition focus:border-[#f2a932] focus:ring-1 focus:ring-[#f2a932]/30"
                />
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-medium text-[#c7ceda]"
                >
                  Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Enter your address"
                  className="w-full resize-none rounded-xl border border-[#252d3a] bg-[#090d16] px-4 py-3 text-sm text-white placeholder:text-[#566174] outline-none transition focus:border-[#f2a932] focus:ring-1 focus:ring-[#f2a932]/30"
                />
              </div>

              {/* Manager */}
              <div>
                <label
                  htmlFor="managerName"
                  className="mb-2 block text-sm font-medium text-[#c7ceda]"
                >
                  Manager Name
                </label>

                <input
                  id="managerName"
                  name="managerName"
                  value={form.managerName}
                  onChange={handleChange}
                  required
                  placeholder="Enter manager name"
                  className="w-full rounded-xl border border-[#252d3a] bg-[#090d16] px-4 py-3 text-sm text-white placeholder:text-[#566174] outline-none transition focus:border-[#f2a932] focus:ring-1 focus:ring-[#f2a932]/30"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#202936] pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="rounded-xl border border-[#303947] px-6 py-3 text-sm font-semibold text-[#b8c0ce] transition hover:border-[#f2a932] hover:text-[#f2a932] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#f2a932] px-6 py-3 text-sm font-bold text-[#11141c] transition hover:bg-[#ffb83f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>

          {/* Bottom note */}
          <p className="mt-5 text-center text-xs text-[#5f6b7d]">
            Your application will be reviewed by the EventOS administration
            team.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function VenueOwnerRegisterPage() {
  return (
    <ProtectedRoute>
      <VenueOwnerRegisterContent />
    </ProtectedRoute>
  )
}
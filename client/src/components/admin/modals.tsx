'use client'

import { useState } from 'react'
import { Spinner } from '../Spinner'
import type { UserSummary } from '../../types'

export function RejectModal({
  open,
  onReject,
  onCancel,
  loading,
}: {
  open: boolean
  onReject: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">Reject</h3>
        <p className="mt-1 text-sm text-ink/50">Provide a reason for rejecting this request.</p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Please provide valid organization information and a working email."
          className="mt-4 w-full rounded-lg border border-paper-dim bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason.trim() || loading}
            onClick={() => onReject(reason.trim())}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmRoleModal({
  open,
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  user: UserSummary | null
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  if (!open || !user) return null

  const isAdmin = user.role === 'ADMIN'
  const action = isAdmin ? 'Remove Admin' : 'Make Admin'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">{action}</h3>
        <p className="mt-1 text-sm text-ink/50">
          {isAdmin
            ? `Are you sure you want to remove admin privileges from ${user.firstName} ${user.lastName}?`
            : `Are you sure you want to grant admin privileges to ${user.firstName} ${user.lastName}?`}
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:bg-amber-deep/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            {action}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmDeleteModal({
  open,
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  user: UserSummary | null
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  if (!open || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">Delete User</h3>
        <p className="mt-1 text-sm text-ink/50">
          Are you sure you want to delete {user.firstName} {user.lastName}? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmRestoreModal({
  open,
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  user: UserSummary | null
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  if (!open || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">Restore User</h3>
        <p className="mt-1 text-sm text-ink/50">
          Are you sure you want to restore {user.firstName} {user.lastName}? They will regain access to their account.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            Restore
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  tone = 'teal',
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  tone?: 'teal' | 'red'
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  if (!open) return null

  const confirmClass =
    tone === 'red'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-teal text-white hover:bg-teal/80'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-paper-dim bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-ink/50">{message}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {loading && <Spinner size={14} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PermanentDeleteModal({
  open,
  title,
  subject,
  confirmName,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  subject: string
  confirmName: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const [phrase, setPhrase] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-red-300 bg-paper p-6">
        <h3 className="font-display text-lg font-semibold text-red-700">{title}</h3>
        <p className="mt-1 text-sm text-ink/60">
          Deleting <span className="font-semibold text-ink">{subject}</span> is permanent and cannot be undone. Please type{' '}
          <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-red-700">{confirmName}</span>{' '}
          to confirm.
        </p>
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={confirmName}
          className="mt-4 w-full rounded-lg border border-paper-dim bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-paper-dim px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-dim/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={phrase !== confirmName || loading}
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner size={14} />}
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  )
}

export function VenueReviewModal({
  open,
  venue,
  onApprove,
  onReject,
  onClose,
  approving,
  rejecting,
}: {
  open: boolean
  venue: any
  onApprove: () => void
  onReject: () => void
  onClose: () => void
  approving: boolean
  rejecting: boolean
}) {
  if (!open || !venue) return null

  const ownerUser = venue.ownerUser || venue.ownerId
  const venueOwner = venue.venueOwner
  const mapUrl = venue.location?.coordinates
    ? `https://www.openstreetmap.org/?mlat=${venue.location.coordinates[1]}&mlon=${venue.location.coordinates[0]}#map=16/${venue.location.coordinates[1]}/${venue.location.coordinates[0]}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 py-6">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-auto rounded-2xl border border-paper-dim bg-paper">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-paper-dim bg-paper px-6 py-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">Review Venue</h3>
            <p className="text-sm text-ink/50">Read-only details for validation</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-ink/60 hover:bg-paper-dim/10">Close</button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <section className="space-y-4">
            <div className="rounded-xl border border-paper-dim p-4">
              <h4 className="text-sm font-semibold text-ink">Venue Details</h4>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-ink/50">Name</dt>
                <dd className="text-ink">{venue.venueName}</dd>
                <dt className="text-ink/50">Status</dt>
                <dd className="text-ink capitalize">{venue.status}</dd>
                <dt className="text-ink/50">Capacity</dt>
                <dd className="text-ink">{venue.capacity}</dd>
                <dt className="text-ink/50">Price/Day</dt>
                <dd className="text-ink">₹{venue.pricePerDay}</dd>
                <dt className="text-ink/50">Payment Policy</dt>
                <dd className="text-ink">{venue.bookingPaymentPolicy}{venue.advancePercentage ? ` (${venue.advancePercentage}%)` : ''}</dd>
                <dt className="text-ink/50">Created</dt>
                <dd className="text-ink">{venue.createdAt ? new Date(venue.createdAt).toLocaleString() : '-'}</dd>
              </dl>
              {venue.description && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-ink/60">Description</p>
                  <p className="mt-1 text-sm text-ink/80 whitespace-pre-wrap">{venue.description}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-paper-dim p-4">
              <h4 className="text-sm font-semibold text-ink">Location</h4>
              <p className="mt-1 text-sm text-ink/80">{venue.location?.formattedAddress}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-ink/50">City</dt>
                <dd className="text-ink">{venue.location?.city}</dd>
                <dt className="text-ink/50">State</dt>
                <dd className="text-ink">{venue.location?.state}</dd>
                <dt className="text-ink/50">Postal Code</dt>
                <dd className="text-ink">{venue.location?.postalCode}</dd>
                <dt className="text-ink/50">Coordinates</dt>
                <dd className="text-ink">{venue.location?.coordinates?.[1]}, {venue.location?.coordinates?.[0]}</dd>
              </dl>
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-amber underline">
                  View on OpenStreetMap
                </a>
              )}
            </div>

            <div className="rounded-xl border border-paper-dim p-4">
              <h4 className="text-sm font-semibold text-ink">Images</h4>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(venue.images || []).map((img: any) => (
                  <a key={img.key || img.url} href={img.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-paper-dim">
                    <img src={img.url} alt={venue.venueName} className="h-40 w-full object-cover" />
                  </a>
                ))}
                {(venue.images || []).length === 0 && <p className="text-xs text-ink/40">No images uploaded</p>}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border border-paper-dim p-4">
              <h4 className="text-sm font-semibold text-ink">Account (User)</h4>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-ink/50">Name</dt>
                <dd className="text-ink">{ownerUser?.firstName || venueOwner?.ownerName || '-'} {ownerUser?.lastName || ''}</dd>
                <dt className="text-ink/50">Email</dt>
                <dd className="text-ink">{ownerUser?.email || venueOwner?.email || '-'}</dd>
                <dt className="text-ink/50">Phone</dt>
                <dd className="text-ink">{ownerUser?.phone || venueOwner?.phone || '-'}</dd>
                <dt className="text-ink/50">Email Verified</dt>
                <dd className="text-ink">{ownerUser?.emailVerified === true ? 'Yes' : ownerUser?.emailVerified === false ? 'No' : '-'}</dd>
                <dt className="text-ink/50">Joined</dt>
                <dd className="text-ink">{ownerUser?.createdAt ? new Date(ownerUser.createdAt).toLocaleDateString() : '-'}</dd>
              </dl>
            </div>

            <div className="rounded-xl border border-paper-dim p-4">
              <h4 className="text-sm font-semibold text-ink">Venue Owner Application</h4>
              {venueOwner ? (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-ink/50">Owner Name</dt>
                  <dd className="text-ink">{venueOwner.ownerName}</dd>
                  <dt className="text-ink/50">Email</dt>
                  <dd className="text-ink">{venueOwner.email}</dd>
                  <dt className="text-ink/50">Phone</dt>
                  <dd className="text-ink">{venueOwner.phone}</dd>
                  <dt className="text-ink/50">Alt Phone</dt>
                  <dd className="text-ink">{venueOwner.alternativePhone}</dd>
                  <dt className="text-ink/50">Manager</dt>
                  <dd className="text-ink">{venueOwner.managerName}</dd>
                  <dt className="text-ink/50">Status</dt>
                  <dd className="text-ink capitalize">{venueOwner.status}</dd>
                  <dt className="text-ink/50">Address</dt>
                  <dd className="col-span-2 text-ink">{venueOwner.address}</dd>
                  {venueOwner.rejectionReason && (
                    <>
                      <dt className="text-ink/50">Rejection Reason</dt>
                      <dd className="col-span-2 text-ink">{venueOwner.rejectionReason}</dd>
                    </>
                  )}
                </dl>
              ) : (
                <p className="mt-2 text-xs text-ink/40">No venue owner application found for this user.</p>
              )}
            </div>

            <div className="rounded-xl border border-amber/40 bg-amber/5 p-4">
              <h4 className="text-sm font-semibold text-ink">Validation Checklist (Read-only)</h4>
              <ul className="mt-2 space-y-1 text-xs text-ink/70">
                <li>• Check owner details match contact info</li>
                <li>• Verify venue location on map</li>
                <li>• Review uploaded photos</li>
                <li>• Check pricing/capacity look reasonable</li>
                <li>• Ensure address consistency</li>
              </ul>
            </div>
          </section>
        </div>

        {venue.status === 'pending' && (
          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-paper-dim bg-paper px-6 py-4">
            <button type="button" onClick={onReject} disabled={rejecting || approving} className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
              {rejecting && <Spinner size={14} />}Reject
            </button>
            <button type="button" onClick={onApprove} disabled={approving || rejecting} className="flex items-center gap-2 rounded-lg border border-teal/40 px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/10 disabled:opacity-60">
              {approving && <Spinner size={14} />}Approve
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
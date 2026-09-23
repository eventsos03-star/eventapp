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
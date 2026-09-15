'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { Spinner } from '../../../components/Spinner'
import { useAuth } from '../../../context/AuthContext'
import { organizationApi } from '../../../lib/organizationApi'
import type { Organization, OrganizationMember } from '../../../types'

type Message = { type: 'success' | 'error'; text: string } | null

function inputClass() {
  return 'rounded-lg border border-paper-dim bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30'
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  organizer: 'Organizer',
  member: 'Member',
}

function MembersContent() {
  const { user } = useAuth()
  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)

  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState<'organizer' | 'member'>('member')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const orgRes = await organizationApi.getMy()
      const orgData = orgRes.data ?? null
      setOrg(orgData)
      if (orgData) {
        const membersRes = await organizationApi.getMembers(orgData.id)
        setMembers(membersRes.data ?? [])
      }
    } catch {
      setError('Could not load organization data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!org || adding) return
    setAdding(true)
    setMessage(null)
    try {
      await organizationApi.addMember(org.id, addEmail.trim(), addRole)
      setMessage({ type: 'success', text: 'Member added successfully' })
      setAddEmail('')
      setAddRole('member')
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add member' })
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(memberId: string) {
    if (!org || removing) return
    setRemoving(memberId)
    setMessage(null)
    try {
      await organizationApi.removeMember(org.id, memberId)
      setMessage({ type: 'success', text: 'Member removed' })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to remove member' })
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Spinner size={28} />
      </div>
    )
  }

  if (!org || org.status !== 'approved') {
    return (
      <div className="min-h-screen bg-ink font-sans text-paper-dim">
        <nav className="flex items-center justify-between border-b border-ink-line px-5 py-6 sm:px-10 lg:px-16">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">E</span>
            <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">EventOS</span>
          </div>
          <Link href="/organization" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Back to Organization</Link>
        </nav>
        <main className="mx-auto max-w-2xl px-5 pb-24 pt-16 sm:px-10 text-center">
          <p className="text-sm text-ink/50">Member management is available after your organization is approved.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-paper-dim">
      <nav className="flex items-center justify-between border-b border-ink-line px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">E</span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">EventOS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/organization" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Organization</Link>
          <Link href="/dashboard" className="text-sm text-paper-dim/70 transition hover:text-paper-dim">Dashboard</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-paper-dim sm:text-4xl">Manage Members</h1>
          <p className="mt-2 text-paper-dim/55">{org.organizationName}</p>
        </div>

        {message && (
          <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${message.type === 'success' ? 'border-teal/30 bg-teal/10 text-teal' : 'border-red-300 bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
        )}

        <div className="relative mb-8 rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Add Member</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-ink/60">EMAIL</span>
              <input required type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="member@email.com" className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-ink/60">ROLE</span>
              <select value={addRole} onChange={(e) => setAddRole(e.target.value as 'organizer' | 'member')} className={inputClass()}>
                <option value="member">Member</option>
                <option value="organizer">Organizer</option>
              </select>
            </label>
            <button type="submit" disabled={adding} className="flex items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-60">
              {adding && <Spinner size={14} />}
              Add
            </button>
          </form>
        </div>

        <div className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Members ({members.length})</h2>
          {members.length === 0 ? (
            <p className="text-sm text-ink/45">No members yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((m) => {
                const userObj = typeof m.userId === 'object' && m.userId !== null ? m.userId : null
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-paper-dim px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {userObj ? `${userObj.firstName} ${userObj.lastName}` : m.inviteEmail ?? '—'}
                      </p>
                      <p className="text-xs text-ink/45">{userObj?.email ?? m.inviteEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg px-2.5 py-0.5 text-xs font-semibold text-ink/60">{ROLE_LABELS[m.role] ?? m.role}</span>
                      {m.role !== 'owner' && (
                        <button
                          type="button"
                          disabled={removing === m.id}
                          onClick={() => void handleRemove(m.id)}
                          className="text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-60"
                        >
                          {removing === m.id ? '...' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default function MembersPage() {
  return (
    <ProtectedRoute>
      <MembersContent />
    </ProtectedRoute>
  )
}

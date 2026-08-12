'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { SessionInfo } from '../../types'

type Message = { type: 'success' | 'error'; text: string } | null

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
  )
}

function Alert({ message }: { message: Message }) {
  if (!message) return null
  const isSuccess = message.type === 'success'
  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${
        isSuccess
          ? 'border-teal/30 bg-teal/10 text-teal'
          : 'border-red-300 bg-red-50 text-red-700'
      }`}
    >
      {message.text}
    </div>
  )
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ok ? 'bg-teal/15 text-teal' : 'bg-amber/20 text-amber-deep'
      }`}
    >
      {label}
    </span>
  )
}

function textInputClass() {
  return 'rounded-lg border border-paper-dim bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30'
}

function DashboardContent() {
  const { user, logoutAll, updateProfile } = useAuth()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [profileMessage, setProfileMessage] = useState<Message>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<Message>(null)
  const [changingPassword, setChangingPassword] = useState(false)
  const [signingOutAll, setSigningOutAll] = useState(false)

  const [sessions, setSessions] = useState<SessionInfo[] | null>(null)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [revokingSession, setRevokingSession] = useState<string | null>(null)

  if (!user) return null

  const fullName = `${user.firstName} ${user.lastName}`

  useEffect(() => {
    let active = true
    api
      .listSessions()
      .then(({ data }) => {
        if (active) setSessions(data ?? [])
      })
      .catch((err: unknown) => {
        if (active) setSessionsError(err instanceof Error ? err.message : 'Could not load sessions')
      })
    return () => {
      active = false
    }
  }, [])

  async function handleRevokeSession(sessionId: string) {
    setRevokingSession(sessionId)
    try {
      await api.revokeSession(sessionId)
      setSessions((prev) => (prev ? prev.filter((s) => s.id !== sessionId) : prev))
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Could not revoke session')
    } finally {
      setRevokingSession(null)
    }
  }

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault()
    setProfileMessage(null)
    setSavingProfile(true)
    try {
      await updateProfile({ firstName, lastName })
      setProfileMessage({ type: 'success', text: 'Profile updated' })
    } catch (err) {
      setProfileMessage({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setPasswordMessage(null)
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    setChangingPassword(true)
    try {
      await api.changePassword({ currentPassword, newPassword })
      setPasswordMessage({ type: 'success', text: 'Password changed. Other devices were signed out.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Change failed' })
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleLogoutAll() {
    setSigningOutAll(true)
    try {
      await logoutAll()
    } catch {
      setSigningOutAll(false)
    }
  }

  async function handleSetPasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setPasswordMessage(null)
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    setChangingPassword(true)
    try {
      await api.setPassword(newPassword)
      setPasswordMessage({ type: 'success', text: 'Password set. Other devices were signed out.' })
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Set password failed' })
    } finally {
      setChangingPassword(false)
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
        <span className="text-sm text-paper-dim/50">{user.email}</span>
      </nav>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-12 sm:px-10 lg:px-16">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-semibold text-paper-dim sm:text-4xl">
            Hello, {user.firstName} 👋
          </h1>
          <p className="mt-2 text-paper-dim/55">Manage your profile and account security.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* profile summary */}
          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6 lg:col-span-2">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-4 font-display text-xl font-semibold text-ink">Profile</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink/45">NAME</dt>
                <dd className="mt-1 text-sm text-ink">{fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink/45">EMAIL</dt>
                <dd className="mt-1 text-sm text-ink">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink/45">PROVIDER</dt>
                <dd className="mt-1 text-sm text-ink">
                  {user.provider === 'google' ? 'Google' : 'Email & password'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink/45">EMAIL VERIFIED</dt>
                <dd className="mt-1.5">
                  <Badge ok={user.emailVerified} label={user.emailVerified ? 'Verified' : 'Pending'} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink/45">ROLE</dt>
                <dd className="mt-1 text-sm text-ink">{user.role}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => void handleLogoutAll()}
              disabled={signingOutAll}
              className="mt-6 flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOutAll && <Spinner />}
              Sign out all devices
            </button>
          </section>

          {/* edit profile */}
          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            <h2 className="mb-4 font-display text-xl font-semibold text-ink">Edit profile</h2>
            <Alert message={profileMessage} />
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">FIRST NAME</span>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={textInputClass()}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide text-ink/60">LAST NAME</span>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={textInputClass()}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile && <Spinner />}
                Save changes
              </button>
            </form>
          </section>

          {/* change / set password */}
          <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
            <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
            {user.provider === 'google' ? (
              <>
                <h2 className="mb-1 font-display text-xl font-semibold text-ink">Set password</h2>
                <p className="mb-4 text-xs text-ink/45">
                  Add an email &amp; password option to your Google account.
                </p>
                <Alert message={passwordMessage} />
                <form onSubmit={handleSetPasswordSubmit} className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">NEW PASSWORD</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={textInputClass()}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">CONFIRM NEW PASSWORD</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={textInputClass()}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {changingPassword && <Spinner />}
                    Set password
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="mb-4 font-display text-xl font-semibold text-ink">Change password</h2>
                <Alert message={passwordMessage} />
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">CURRENT PASSWORD</span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={textInputClass()}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">NEW PASSWORD</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={textInputClass()}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink/60">CONFIRM NEW PASSWORD</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={textInputClass()}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {changingPassword && <Spinner />}
                    Change password
                  </button>
                </form>
              </>
            )}
          </section>
        </div>

        {/* active sessions */}
        <section className="mt-6 relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Active sessions</h2>
          {sessionsError && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {sessionsError}
            </div>
          )}
          {!sessions && !sessionsError ? (
            <p className="text-sm text-ink/45">Loading sessions…</p>
          ) : sessions && sessions.length === 0 ? (
            <p className="text-sm text-ink/45">No active sessions.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {sessions?.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-paper-dim px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {session.browser || 'Unknown browser'}
                      </span>
                      {session.isCurrent && <Badge ok label="This device" />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink/45">
                      {session.ip || 'Unknown IP'} · last seen{' '}
                      {new Date(session.lastSeenAt).toLocaleString()}
                    </p>
                  </div>
                  {!session.isCurrent && (
                    <button
                      type="button"
                      onClick={() => void handleRevokeSession(session.id)}
                      disabled={revokingSession === session.id}
                      className="flex shrink-0 items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {revokingSession === session.id && <Spinner />}
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
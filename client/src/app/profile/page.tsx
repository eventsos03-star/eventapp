'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { ProtectedRoute } from '../../components/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { SessionInfo } from '../../types'
import { Layout } from '@/components/Layout'

type Message = {
  type: 'success' | 'error'
  text: string
} | null

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
  )
}

function Badge({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {children}
    </span>
  )
}

function Alert({ message }: { message: Message }) {
  if (!message) return null

  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${
        message.type === 'success'
          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
          : 'border-red-400/20 bg-red-400/10 text-red-300'
      }`}
    >
      {message.text}
    </div>
  )
}

function Icon({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber/10 text-amber">
      {children}
    </span>
  )
}

function textInputClass() {
  return `
    w-full rounded-lg
    border border-white/10
    bg-[#181c25]
    px-3.5 py-2.5
    text-sm text-paper
    outline-none transition
    placeholder:text-paper/30
    focus:border-amber
    focus:ring-2 focus:ring-amber/20
  `
}

function  ProfileContent() {
  const { user, logoutAll, updateProfile } = useAuth()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')

  const [profileMessage, setProfileMessage] =
    useState<Message>(null)

  const [savingProfile, setSavingProfile] =
    useState(false)

  const [currentPassword, setCurrentPassword] =
    useState('')

  const [newPassword, setNewPassword] =
    useState('')

  const [confirmNewPassword, setConfirmNewPassword] =
    useState('')

  const [passwordMessage, setPasswordMessage] =
    useState<Message>(null)

  const [changingPassword, setChangingPassword] =
    useState(false)

  const [sessions, setSessions] =
    useState<SessionInfo[] | null>(null)

  const [sessionsError, setSessionsError] =
    useState<string | null>(null)

  const [revokingSession, setRevokingSession] =
    useState<string | null>(null)

  const [signingOutAll, setSigningOutAll] =
    useState(false)

  useEffect(() => {
    if (!user) return

    let active = true

    api
      .listSessions()
      .then(({ data }) => {
        if (active) {
          setSessions(data ?? [])
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setSessionsError(
            err instanceof Error
              ? err.message
              : 'Could not load sessions',
          )
        }
      })

    return () => {
      active = false
    }
  }, [user])

  if (!user) return null

  const fullName =
    `${user.firstName} ${user.lastName}`.trim()

  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  async function handleProfileSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()

    setProfileMessage(null)
    setSavingProfile(true)

    try {
      await updateProfile({
        firstName,
        lastName,
      })

      setProfileMessage({
        type: 'success',
        text: 'Profile updated successfully.',
      })
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Could not update profile.',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()

    setPasswordMessage(null)

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New passwords do not match.',
      })

      return
    }

    setChangingPassword(true)

    try {
      await api.changePassword({
        currentPassword,
        newPassword,
      })

      setPasswordMessage({
        type: 'success',
        text: 'Password changed successfully.',
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Could not change password.',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleRevokeSession(
    sessionId: string,
  ) {
    setRevokingSession(sessionId)

    try {
      await api.revokeSession(sessionId)

      setSessions((prev) =>
        prev
          ? prev.filter(
              (session) => session.id !== sessionId,
            )
          : prev,
      )
    } catch (err) {
      setSessionsError(
        err instanceof Error
          ? err.message
          : 'Could not revoke session.',
      )
    } finally {
      setRevokingSession(null)
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

  return (
    <Layout>
    <div className="min-h-screen bg-[#11141c] text-[#eee6d4]">

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">

        {/* Page heading */}

        <div className="mb-8">

          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#eee6d4] sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-[#918b7e]">
            Manage your personal information and EventOS account.
          </p>

        </div>

        {/* =====================================================
            PROFILE GRID
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">

          {/* =================================================
              LEFT SIDEBAR
          ================================================== */}

          <aside className="space-y-5">

            {/* Profile card */}

            <section className="rounded-xl border border-[#30343e] bg-[#171a22] p-4">

              {/* Avatar */}

              <div className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-lg border border-[#3a3e48] bg-[#1d222d] font-display text-2xl font-semibold text-amber">
                {initials}
              </div>

              <h2 className="text-center text-sm font-semibold text-[#eee6d4]">
                {fullName}
              </h2>

              <p className="mt-1 text-center text-[10px] text-[#77746d]">
                Member since August 2026
              </p>

              <div className="mt-5 space-y-3">

                {/* Email */}

                <div className="flex items-start gap-2 text-[10px] text-[#9d998f]">

                  <span className="mt-0.5 text-amber">
                    ✉
                  </span>

                  <span className="min-w-0 truncate">
                    {user.email}
                  </span>

                </div>

                {/* Phone */}

                <div className="flex items-start gap-2 text-[10px] text-[#9d998f]">

                  <span className="mt-0.5 text-amber">
                    ◦
                  </span>

                  <span>
                    +91 9876543210
                  </span>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById('edit-profile')
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    })
                }
                className="mt-5 w-full rounded-lg border border-[#383c46] px-3 py-2 text-[10px] font-semibold text-[#d4cec1] transition hover:border-amber hover:text-amber"
              >
                Edit Profile
              </button>

            </section>

            {/* Account settings */}

            <section className="rounded-xl border border-[#30343e] bg-[#171a22] p-4">

              <h3 className="font-display text-sm font-semibold text-[#eee6d4]">
                Account Settings
              </h3>

              <div className="my-3 h-px bg-[#30343e]" />

              <div className="space-y-1">

                {/* Notifications */}

                <button
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-white/[0.03]"
                >

                  <span className="text-xs text-amber">
                    ♧
                  </span>

                  <span>
                    <span className="block text-[10px] font-semibold text-[#d8d1c3]">
                      Notifications
                    </span>

                    <span className="mt-0.5 block text-[8px] leading-relaxed text-[#77746d]">
                      Manage notification preferences.
                    </span>
                  </span>

                </button>

                {/* Security */}

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById('security')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-white/[0.03]"
                >

                  <span className="text-xs text-amber">
                    ◈
                  </span>

                  <span>
                    <span className="block text-[10px] font-semibold text-[#d8d1c3]">
                      Security
                    </span>

                    <span className="mt-0.5 block text-[8px] leading-relaxed text-[#77746d]">
                      Manage password and account security.
                    </span>
                  </span>

                </button>

                {/* Privacy */}

                <button
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-white/[0.03]"
                >

                  <span className="text-xs text-amber">
                    ♢
                  </span>

                  <span>
                    <span className="block text-[10px] font-semibold text-[#d8d1c3]">
                      Privacy
                    </span>

                    <span className="mt-0.5 block text-[8px] leading-relaxed text-[#77746d]">
                      Manage privacy settings.
                    </span>
                  </span>

                </button>

                {/* Logout */}

                <button
                  type="button"
                  onClick={() =>
                    void handleLogoutAll()
                  }
                  disabled={signingOutAll}
                  className="mt-2 flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left text-red-400 transition hover:bg-red-400/5 disabled:opacity-60"
                >

                  <span className="text-xs">
                    ↪
                  </span>

                  <span>
                    <span className="block text-[10px] font-semibold">
                      Logout
                    </span>

                    <span className="mt-0.5 block text-[8px] text-red-400/60">
                      Sign out of EventOS.
                    </span>
                  </span>

                </button>

              </div>

            </section>

          </aside>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}

          <div className="space-y-5">

            {/* =================================================
                PERSONAL INFORMATION
            ================================================== */}

            <section className="overflow-hidden rounded-xl border border-[#30343e] bg-[#171a22]">

              <div className="flex items-center justify-between border-b border-[#30343e] px-5 py-4">

                <h2 className="font-display text-sm font-semibold text-[#eee6d4]">
                  Personal Information
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById('edit-profile')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }
                  className="text-[10px] font-semibold text-amber transition hover:text-[#ffc15a]"
                >
                  Edit
                </button>

              </div>

              <div className="grid grid-cols-1 gap-y-6 px-5 py-5 sm:grid-cols-2">

                <div>
                  <p className="text-[8px] font-medium uppercase tracking-wide text-[#77746d]">
                    Full Name
                  </p>

                  <p className="mt-1.5 text-xs font-medium text-[#ddd6c9]">
                    {fullName}
                  </p>
                </div>

                <div>
                  <p className="text-[8px] font-medium uppercase tracking-wide text-[#77746d]">
                    Email Address
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">

                    <p className="text-xs font-medium text-[#ddd6c9]">
                      {user.email}
                    </p>

                    {user.emailVerified && (
                      <Badge>
                        Verified
                      </Badge>
                    )}

                  </div>
                </div>

                <div>
                  <p className="text-[8px] font-medium uppercase tracking-wide text-[#77746d]">
                    Phone Number
                  </p>

                  <p className="mt-1.5 text-xs font-medium text-[#ddd6c9]">
                    +91 9876543210
                  </p>
                </div>

                <div>
                  <p className="text-[8px] font-medium uppercase tracking-wide text-[#77746d]">
                    Location
                  </p>

                  <p className="mt-1.5 text-xs font-medium text-[#ddd6c9]">
                    Bangalore, Karnataka
                  </p>
                </div>

              </div>

            </section>

            {/* =================================================
                EVENT ACTIVITY
            ================================================== */}

            <section className="overflow-hidden rounded-xl border border-[#30343e] bg-[#171a22]">

              <div className="border-b border-[#30343e] px-5 py-4">

                <h2 className="font-display text-sm font-semibold text-[#eee6d4]">
                  My Event Activity
                </h2>

                <p className="mt-1 text-[9px] text-[#77746d]">
                  View your event participation and certificates.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">

                {/* Registrations */}

                <div className="rounded-lg border border-[#30343e] bg-[#14171e] p-4">

                  <div className="flex items-start gap-3">

                    <Icon>
                      <span className="text-sm">
                        ▣
                      </span>
                    </Icon>

                    <div>

                      <h3 className="text-xs font-semibold text-[#ddd6c9]">
                        My Registrations
                      </h3>

                      <p className="mt-1 text-[9px] leading-relaxed text-[#77746d]">
                        View events you have registered for.
                      </p>

                    </div>

                  </div>

                  <a
                    href="/registrations"
                    className="mt-4 block rounded-lg border border-[#343943] py-2 text-center text-[9px] font-semibold text-[#bdb7ab] transition hover:border-amber hover:text-amber"
                  >
                    View Registrations
                  </a>

                </div>

                {/* Certificates */}

                <div className="rounded-lg border border-[#30343e] bg-[#14171e] p-4">

                  <div className="flex items-start gap-3">

                    <Icon>
                      <span className="text-sm">
                        ♙
                      </span>
                    </Icon>

                    <div>

                      <h3 className="text-xs font-semibold text-[#ddd6c9]">
                        My Certificates
                      </h3>

                      <p className="mt-1 text-[9px] leading-relaxed text-[#77746d]">
                        View certificates earned from completed events.
                      </p>

                    </div>

                  </div>

                  <a
                    href="/certificates"
                    className="mt-4 block rounded-lg border border-[#343943] py-2 text-center text-[9px] font-semibold text-[#bdb7ab] transition hover:border-amber hover:text-amber"
                  >
                    View Certificates
                  </a>

                </div>

              </div>

            </section>

            {/* =================================================
                ORGANIZATION
            ================================================== */}

            <section className="rounded-xl border border-[#30343e] bg-[#171a22] p-5">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-start gap-3">

                  <Icon>
                    <span className="text-sm">
                      ▦
                    </span>
                  </Icon>

                  <div>

                    <h2 className="text-xs font-semibold text-[#ddd6c9]">
                      {user?.organizationId ? 'Your Organization' : 'Become an Organization'}
                    </h2>

                    <p className="mt-1 max-w-xl text-[9px] leading-relaxed text-[#77746d]">
                      {user?.organizationId
                        ? 'Manage your organization, members, and events.'
                        : 'Create an organization, organize events, build your team, and manage event operations.'}
                    </p>

                  </div>

                </div>

                <a
                  href={user?.organizationId ? '/organization' : '/organization/create'}
                  className="shrink-0 rounded-lg bg-amber px-5 py-2.5 text-center text-[9px] font-bold text-[#11141c] transition hover:bg-[#ffc15a]"
                >
                  {user?.organizationId ? 'View Your Organization' : 'Become an Organization'}
                </a>

              </div>

            </section>

            {/* =================================================
                VENUE OWNER
            ================================================== */}

            <section className="rounded-xl border border-[#30343e] bg-[#171a22] p-5">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-start gap-3">

                  <Icon>
                    <span className="text-sm">
                      ⌖
                    </span>
                  </Icon>

                  <div>

                    <h2 className="text-xs font-semibold text-[#ddd6c9]">
                      Become a Venue Owner
                    </h2>

                    <p className="mt-1 text-[9px] leading-relaxed text-[#77746d]">
                      List and manage venues and make them available
                      for event organizers.
                    </p>

                  </div>

                </div>

                <a
                  href="/venues/create"
                  className="shrink-0 rounded-lg border border-[#3a3e48] px-5 py-2 text-center text-[9px] font-semibold text-[#c9c2b5] transition hover:border-amber hover:text-amber"
                >
                  Become a Venue Owner
                </a>

              </div>

            </section>

            {/* =================================================
                EDIT PROFILE
            ================================================== */}

            <section
              id="edit-profile"
              className="overflow-hidden rounded-xl border border-[#30343e] bg-[#171a22]"
            >

              <div className="border-b border-[#30343e] px-5 py-4">

                <h2 className="font-display text-sm font-semibold text-[#eee6d4]">
                  Edit Profile
                </h2>

                <p className="mt-1 text-[9px] text-[#77746d]">
                  Update your personal information.
                </p>

              </div>

              <form
                onSubmit={handleProfileSubmit}
                className="p-5"
              >

                <Alert message={profileMessage} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <label>

                    <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#88847a]">
                      First Name
                    </span>

                    <input
                      required
                      value={firstName}
                      onChange={(event) =>
                        setFirstName(event.target.value)
                      }
                      className={textInputClass()}
                    />

                  </label>

                  <label>

                    <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#88847a]">
                      Last Name
                    </span>

                    <input
                      required
                      value={lastName}
                      onChange={(event) =>
                        setLastName(event.target.value)
                      }
                      className={textInputClass()}
                    />

                  </label>

                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="mt-5 flex items-center gap-2 rounded-lg bg-amber px-5 py-2.5 text-xs font-bold text-[#11141c] transition hover:bg-[#ffc15a] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {savingProfile && <Spinner />}

                  Save Changes

                </button>

              </form>

            </section>

            {/* =================================================
                SECURITY
            ================================================== */}

            <section
              id="security"
              className="overflow-hidden rounded-xl border border-[#30343e] bg-[#171a22]"
            >

              <div className="border-b border-[#30343e] px-5 py-4">

                <h2 className="font-display text-sm font-semibold text-[#eee6d4]">
                  Security
                </h2>

                <p className="mt-1 text-[9px] text-[#77746d]">
                  Manage your password and account security.
                </p>

              </div>

              <form
                onSubmit={handlePasswordSubmit}
                className="max-w-lg space-y-4 p-5"
              >

                <Alert message={passwordMessage} />

                <label className="block">

                  <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#88847a]">
                    Current Password
                  </span>

                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(event.target.value)
                    }
                    className={textInputClass()}
                  />

                </label>

                <label className="block">

                  <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#88847a]">
                    New Password
                  </span>

                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    className={textInputClass()}
                  />

                </label>

                <label className="block">

                  <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#88847a]">
                    Confirm New Password
                  </span>

                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(event) =>
                      setConfirmNewPassword(event.target.value)
                    }
                    className={textInputClass()}
                  />

                </label>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-2 rounded-lg bg-amber px-5 py-2.5 text-xs font-bold text-[#11141c] transition hover:bg-[#ffc15a] disabled:opacity-60"
                >

                  {changingPassword && <Spinner />}

                  Change Password

                </button>

              </form>

            </section>

            {/* =================================================
                ACTIVE SESSIONS
            ================================================== */}

            <section className="overflow-hidden rounded-xl border border-[#30343e] bg-[#171a22]">

              <div className="flex flex-col gap-3 border-b border-[#30343e] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h2 className="font-display text-sm font-semibold text-[#eee6d4]">
                    Active Sessions
                  </h2>

                  <p className="mt-1 text-[9px] text-[#77746d]">
                    Devices currently signed in to your account.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleLogoutAll()
                  }
                  disabled={signingOutAll}
                  className="rounded-lg border border-red-400/20 px-3 py-2 text-[9px] font-semibold text-red-400 transition hover:bg-red-400/5 disabled:opacity-60"
                >
                  {signingOutAll
                    ? 'Signing out...'
                    : 'Sign out all'}
                </button>

              </div>

              <div className="p-5">

                {sessionsError && (
                  <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-xs text-red-300">
                    {sessionsError}
                  </div>
                )}

                {!sessions && !sessionsError ? (

                  <p className="text-xs text-[#77746d]">
                    Loading sessions...
                  </p>

                ) : sessions &&
                  sessions.length === 0 ? (

                  <p className="text-xs text-[#77746d]">
                    No active sessions.
                  </p>

                ) : (

                  <ul className="space-y-3">

                    {sessions?.map((session) => (

                      <li
                        key={session.id}
                        className="flex flex-col gap-3 rounded-lg border border-[#30343e] bg-[#14171e] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="text-xs font-semibold text-[#d9d2c5]">
                              {session.browser ||
                                'Unknown browser'}
                            </span>

                            {session.isCurrent && (
                              <Badge>
                                This device
                              </Badge>
                            )}

                          </div>

                          <p className="mt-1 text-[9px] text-[#77746d]">
                            {session.ip ||
                              'Unknown IP'}
                            {' · '}
                            Last seen{' '}
                            {new Date(
                              session.lastSeenAt,
                            ).toLocaleString()}
                          </p>

                        </div>

                        {!session.isCurrent && (

                          <button
                            type="button"
                            onClick={() =>
                              void handleRevokeSession(
                                session.id,
                              )
                            }
                            disabled={
                              revokingSession ===
                              session.id
                            }
                            className="self-start rounded-lg border border-red-400/20 px-3 py-1.5 text-[9px] font-semibold text-red-400 transition hover:bg-red-400/5 disabled:opacity-60 sm:self-auto"
                          >
                            {revokingSession ===
                            session.id
                              ? 'Revoking...'
                              : 'Revoke'}
                          </button>

                        )}

                      </li>

                    ))}

                  </ul>

                )}

              </div>

            </section>

          </div>
        </div>
      </main>
    </div>
    </Layout>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}
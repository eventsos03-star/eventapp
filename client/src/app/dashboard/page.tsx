'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { Layout } from '../../components/Layout'
import { Field } from '../../components/Field'
import { Spinner } from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

function DashboardContent() {
  const { user, logoutAll, updateProfile } = useAuth()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)
  const [signingOutAll, setSigningOutAll] = useState(false)

  if (!user) return null

  const fullName = `${user.firstName} ${user.lastName}`

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

  return (
    <Layout>
      <div className="welcome">
        <h1>Hello, {user.firstName} 👋</h1>
        <p>Manage your profile and account security.</p>
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <h2>Profile</h2>
          <dl className="profile-list">
            <div>
              <dt>Name</dt>
              <dd>{fullName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{user.provider === 'google' ? 'Google' : 'Email & password'}</dd>
            </div>
            <div>
              <dt>Email verified</dt>
              <dd>
                <span className={`badge ${user.emailVerified ? 'badge-success' : 'badge-warning'}`}>
                  {user.emailVerified ? 'Verified' : 'Pending'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </div>
          </dl>
          <button type="button" className="btn btn-danger-outline" onClick={() => void handleLogoutAll()} disabled={signingOutAll}>
            {signingOutAll ? <Spinner /> : 'Sign out all devices'}
          </button>
        </section>

        <section className="card">
          <h2>Edit profile</h2>
          {profileMessage && <div className={`alert alert-${profileMessage.type}`}>{profileMessage.text}</div>}
          <form onSubmit={handleProfileSubmit} className="form">
            <div className="form-row">
              <Field
                label="First name"
                name="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Field
                label="Last name"
                name="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? <Spinner /> : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Change password</h2>
          {passwordMessage && <div className={`alert alert-${passwordMessage.type}`}>{passwordMessage.text}</div>}
          <form onSubmit={handlePasswordSubmit} className="form">
            <Field
              label="Current password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Field
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Field
              label="Confirm new password"
              name="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={changingPassword}>
              {changingPassword ? <Spinner /> : 'Change password'}
            </button>
          </form>
        </section>
      </div>
    </Layout>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

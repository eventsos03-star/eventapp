'use client'

import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">E</span>
          <span className="brand-name">EventOS</span>
        </div>
        <div className="landing-nav-actions">
          {user ? (
            <Link href="/dashboard" className="btn btn-primary">Go to dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Sign in</Link>
              <Link href="/register" className="btn btn-primary">Get started</Link>
            </>
          )}
        </div>
      </nav>

      <main className="landing-main">
        <div className="landing-hero">
          <h1>Your events, your identity — protected.</h1>
          <p>
            EventOS is a secure authentication platform. Create an account, verify your email,
            sign in with Google, and keep your sessions safe — all in one place.
          </p>
          <div className="landing-cta">
            <Link href={user ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
              {user ? 'Open dashboard' : 'Create free account'}
            </Link>
          </div>
        </div>

        <div className="feature-grid">
          <div className="card feature">
            <h3>Email verification</h3>
            <p>Every account must be verified before the first sign-in, keeping bots out.</p>
          </div>
          <div className="card feature">
            <h3>Google login</h3>
            <p>One-tap sign in with your existing Google account.</p>
          </div>
          <div className="card feature">
            <h3>Password recovery</h3>
            <p>Forgot your password? We'll email you a secure reset link.</p>
          </div>
          <div className="card feature">
            <h3>Session control</h3>
            <p>See your devices, change your password, and sign out everywhere.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

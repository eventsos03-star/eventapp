'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/dashboard" className="brand">
            <span className="brand-mark" aria-hidden="true">
              E
            </span>
            <span className="brand-name">EventOS</span>
          </Link>
          {user && (
            <div className="topbar-user">
              <span className="avatar" aria-hidden="true">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </span>
              <span className="topbar-email">{user.email}</span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}

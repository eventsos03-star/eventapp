'use client'

import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useEffect, useRef, useState } from 'react'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuth()

  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const mobileProfileRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close profile and mobile menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      const clickedInsideDesktopProfile =
        profileRef.current?.contains(target) ?? false

      const clickedInsideMobileProfile =
        mobileProfileRef.current?.contains(target) ?? false

      if (!clickedInsideDesktopProfile && !clickedInsideMobileProfile) {
        setProfileOpen(false)
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target)
      ) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close menus when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleLogOut = async () => {
    try {
      setProfileOpen(false)
      setMobileMenuOpen(false)
      await logout()
    } catch (e) {
      console.error('logout Failed:', e)
    }
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="relative z-50 w-full border-b border-ink-line bg-[#12151D]">
      <div className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">

        {/* Logo */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex shrink-0 items-center gap-2"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">
            E
          </span>

          <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">
            EventOS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 md:flex">

          <Link
            href="/"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-paper-dim transition hover:text-amber"
          >
            HOME
          </Link>

          <Link
            href="/events"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-paper-dim transition hover:text-amber"
          >
            EVENTS
          </Link>

          {user ? (
            <div className="ml-2 flex items-center gap-3">

              {/* Notification */}
              <NotificationBell />

              {/* Profile */}
              <div ref={profileRef} className="relative">

                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-amber font-semibold text-ink transition hover:bg-amber-deep"
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                >
                  {user.firstName.charAt(0)}
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-ink-line bg-ink-soft p-2 shadow-lg">

                    <Link
                      href="/my-registrations"
                      className="block rounded-lg px-3 py-2.5 text-sm text-paper-dim transition hover:bg-ink-line"
                      onClick={() => setProfileOpen(false)}
                    >
                      My Registrations
                    </Link>

                    <Link
                      href="/profile"
                      className="block rounded-lg px-3 py-2.5 text-sm text-paper-dim transition hover:bg-ink-line"
                      onClick={() => setProfileOpen(false)}
                    >
                      Profile Settings
                    </Link>

                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="block rounded-lg px-3 py-2.5 text-sm text-paper-dim transition hover:bg-ink-line"
                        onClick={() => setProfileOpen(false)}
                      >
                        Admin
                      </Link>
                    )}

                    <div className="my-1 border-t border-ink-line" />

                    <button
                      type="button"
                      onClick={handleLogOut}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-paper-dim transition hover:bg-ink-line"
                    >
                      Sign out
                    </button>

                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Desktop Authentication */
            <div className="ml-2 flex items-center gap-2">

              <Link
                href="/login"
                className="rounded-lg border border-ink-line px-4 py-2.5 text-sm font-semibold text-paper-dim transition hover:border-paper-dim/60"
              >
                Sign in
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep"
              >
                Get started
              </Link>

            </div>
          )}

        </div>

        {/* Mobile Right Section */}
        <div
          ref={mobileMenuRef}
          className="relative flex shrink-0 items-center gap-2 md:hidden"
        >

          {/* Mobile Notification */}
          {user && <NotificationBell />}

          {/* Mobile Profile */}
          {user && (
            <div ref={mobileProfileRef} className="relative">

              <button
                type="button"
                onClick={() => {
                  setProfileOpen((prev) => !prev)
                  setMobileMenuOpen(false)
                }}
                className="grid h-9 w-9 place-items-center rounded-full bg-amber font-semibold text-ink"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                {user.firstName.charAt(0)}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-ink-line bg-ink-soft p-2 shadow-lg">

                  <Link
                    href="/my-registrations"
                    className="block rounded-lg px-3 py-2.5 text-sm text-paper-dim transition hover:bg-ink-line"
                    onClick={() => setProfileOpen(false)}
                  >
                    My Registrations
                  </Link>

                  <Link
                    href="/profile"
                    className="block rounded-lg px-3 py-2.5 text-sm text-paper-dim transition hover:bg-ink-line"
                    onClick={() => setProfileOpen(false)}
                  >
                    Profile Settings
                  </Link>

                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="block rounded-lg px-3 py-2.5 text-sm text-paper-dim transition hover:bg-ink-line"
                      onClick={() => setProfileOpen(false)}
                    >
                      Admin
                    </Link>
                  )}

                  <div className="my-1 border-t border-ink-line" />

                  <button
                    type="button"
                    onClick={handleLogOut}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-paper-dim transition hover:bg-ink-line"
                  >
                    Sign out
                  </button>

                </div>
              )}
            </div>
          )}

          {/* Hamburger Button */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((prev) => !prev)
              setProfileOpen(false)
            }}
            className="grid h-10 w-10 place-items-center rounded-lg border border-ink-line text-paper-dim transition hover:bg-ink-line"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              /* Close Icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              /* Hamburger Icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            )}
          </button>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-ink-line bg-[#12151D] p-3 shadow-xl">

              <Link
                href="/"
                onClick={closeMobileMenu}
                className="block rounded-lg px-4 py-3 text-sm font-semibold text-paper-dim transition hover:bg-ink-line hover:text-amber"
              >
                HOME
              </Link>

              <Link
                href="/events"
                onClick={closeMobileMenu}
                className="block rounded-lg px-4 py-3 text-sm font-semibold text-paper-dim transition hover:bg-ink-line hover:text-amber"
              >
                EVENTS
              </Link>

              {!user && (
                <>
                  <div className="my-2 border-t border-ink-line" />

                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="block rounded-lg px-4 py-3 text-sm font-semibold text-paper-dim transition hover:bg-ink-line"
                  >
                    Sign in
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="block rounded-lg bg-amber px-4 py-3 text-center text-sm font-semibold text-ink transition hover:bg-amber-deep"
                  >
                    Get started
                  </Link>
                </>
              )}

            </div>
          )}
        </div>

      </div>
    </nav>
  )
}
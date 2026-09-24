'use client'

import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useEffect, useRef, useState } from 'react'

export default function Navbar() {
  const { user ,logout} = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      profileRef.current &&
      !profileRef.current.contains(event.target as Node)
    ) {
      setProfileOpen(false)
    }
  }

  document.addEventListener('mousedown', handleClickOutside)

  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
  }
}, []);

const handleLogOut=async()=>{
  try{
    await logout()
  }catch(e){
    console.error("logout Failed:",e)
  }

}
  return (
    <nav className="flex items-center justify-between border-b border-ink-line bg-[#12151D] px-5 py-6 sm:px-10 lg:px-16">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">
          E
        </span>

        <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">
          EventOS
        </span>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-2.5">
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
         <div ref={profileRef} className="relative">
    <button
      type="button"
      onClick={() => setProfileOpen((prev) => !prev)}
      className="grid h-10 w-10 place-items-center rounded-full bg-amber font-semibold text-ink"
      aria-label="Open profile menu"
      aria-expanded={profileOpen}
    >
      {user.firstName.charAt(0)}
    </button>

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
        href="/my-tickets"
        className="block rounded-lg px-3 py-2.5 text-sm text-paper-dim transition hover:bg-ink-line"
        onClick={() => setProfileOpen(false)}
      >
        My Tickets
      </Link>

      <Link
        href="/profile"
        className="block rounded-lg px-3 py-2.5 text-sm text-paper-dim transition hover:bg-ink-line"
        onClick={() => setProfileOpen(false)}
      >
        Profile Settings
      </Link>

      <div className="my-1 border-t border-ink-line" />

      <button
        type="button"
        onClick={() => {
          setProfileOpen(false)
          handleLogOut()
        }}
        className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-paper-dim transition hover:bg-ink-line"
      >
        Sign out
      </button>
    </div>
  )}
</div>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-lg border border-ink-line px-4.5 py-2.5 text-sm font-semibold text-paper-dim transition hover:border-paper-dim/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-amber px-4.5 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
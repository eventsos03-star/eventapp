'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Store,
  Users,
  ArrowLeft,
  Menu,
} from 'lucide-react'
import { AdminRoute } from '../../components/AdminRoute'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'Venue Owners', href: '/admin/venue-owners', icon: Store },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Events', href: '/admin/events', icon: CalendarDays },
  { label: 'Venues', href: '/admin/venues', icon: MapPin },
  { label: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
]

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname?.startsWith(href)

  return (
    <div className="flex min-h-screen w-full flex-col bg-ink font-sans text-paper-dim antialiased lg:flex-row">
      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-ink/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-ink-line bg-ink-soft p-4 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center gap-2.5 border-b border-ink-line px-2 pb-5 pt-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber font-display text-base font-bold text-ink">
            E
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-paper-dim">EventOS Admin</p>
            <p className="text-xs text-paper-dim/50">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setNavOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-amber font-semibold text-ink'
                    : 'text-paper-dim/60 hover:bg-white/5 hover:text-paper-dim'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-4 space-y-2 border-t border-ink-line pt-4">
          <Link
            href="/profile"
            onClick={() => setNavOpen(false)}
            className="flex items-center justify-center gap-2 rounded-xl border border-ink-line px-4 py-2.5 text-xs font-semibold text-paper-dim/60 transition hover:bg-white/5 hover:text-paper-dim"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full rounded-xl border border-red-500/30 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-line bg-ink-soft px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={navOpen}
            className="grid h-9 w-9 place-items-center rounded-lg border border-ink-line text-paper-dim transition hover:bg-white/5"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber font-display text-sm font-bold text-ink">
            E
          </span>
          <span className="font-display text-sm font-semibold text-paper-dim">EventOS Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-10">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoute>
      <AdminShell>{children}</AdminShell>
    </AdminRoute>
  )
}
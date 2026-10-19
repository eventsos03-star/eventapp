"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Users,
  UserPlus,
  MapPin,
  Award,
  CircleDollarSign,
  Plus,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const orgRole = (user as any)?.orgRole || "member";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/my-organization" ? pathname === href : pathname?.startsWith(href);

  // Common items everyone can see
  const navItems = [
    { label: "Dashboard", href: "/my-organization", icon: LayoutDashboard },
    { label: "Events", href: "/my-organization/events", icon: CalendarDays },
    { label: "Tasks & Operations", href: "/my-organization/tasks", icon: CheckSquare },
  ];

  // Role-specific items
  if (orgRole === "owner") {
    navItems.push(
      { label: "Participants", href: "/my-organization/participants", icon: Users },
      { label: "Certificates", href: "/my-organization/certificates", icon: Award },
      { label: "Finance", href: "/my-organization/finance", icon: CircleDollarSign },
      { label: "Members", href: "/my-organization/members", icon: UserPlus },
      { label: "Venues", href: "/my-organization/venues", icon: MapPin }
    );
  } else if (orgRole === "finance_manager") {
    navItems.push({ label: "Finance", href: "/my-organization/finance", icon: CircleDollarSign });
  } else if (orgRole === "user_manager") {
    navItems.push({ label: "Participants", href: "/my-organization/participants", icon: Users });
  } else if (orgRole === "certificate_manager") {
    navItems.push({ label: "Certificates", href: "/my-organization/certificates", icon: Award });
  } else if (orgRole === "organizer") {
    navItems.push({ label: "Venues", href: "/my-organization/venues", icon: MapPin });
  }

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      {/* Org Header */}
      <div className="flex items-center gap-2.5 px-2 pb-6 pt-2 border-b border-white/10 mb-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 font-black text-slate-950 text-base shadow-lg shadow-amber-500/20">
          E
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {user?.firstName ?? "My Organization"}
          </p>
          <p className="text-[11px] text-amber-400 font-medium uppercase">
            {orgRole.replace("_", " ")}
          </p>
        </div>
      </div>

      {/* Dynamic Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        {(orgRole === "owner" || orgRole === "organizer") && (
          <Link
            href="/my-organization/events/new"
            onClick={onLinkClick}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        )}
        <Link
          href="/profile"
          onClick={onLinkClick}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-white font-sans antialiased flex flex-col">

      {/* ─── Mobile Top Bar (hidden on lg+) ─── */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0d1220] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500 font-black text-slate-950 text-sm">
            E
          </div>
          <span className="text-sm font-bold text-white">
            Event<span className="text-amber-500">OS</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white transition"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ─── Mobile Drawer Overlay ─── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative z-10 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-white/10 bg-[#0d1220] p-4 overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="mb-4 self-end grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white transition"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ─── Main Body: Desktop Sidebar + Content ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (hidden on < lg) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0d1220] p-4 overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
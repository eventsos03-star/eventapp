"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  CalendarDays,
  Settings2,
  Users,
  UserPlus,
  MapPin,
  Award,
  BarChart3,
  Settings,
  Plus,
  ArrowLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/my-organization", icon: LayoutDashboard },
  { label: "Events", href: "/my-organization/events", icon: CalendarDays },
  { label: "Operations", href: "/my-organization/operations", icon: Settings2 },
  { label: "Participants", href: "/my-organization/participants", icon: Users },
  { label: "Members", href: "/my-organization/members", icon: UserPlus },
  { label: "Venues", href: "/my-organization/venues", icon: MapPin },
  { label: "Certificates", href: "/my-organization/certificates", icon: Award },
  { label: "Reports", href: "/my-organization/reports", icon: BarChart3 },
  { label: "Settings", href: "/my-organization/settings", icon: Settings },
];

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) =>
    href === "/my-organization"
      ? pathname === href
      : pathname?.startsWith(href);

  return (
    <div className="flex min-h-screen w-full bg-[#090d16] text-white font-sans antialiased">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0d1220] p-4">
        {/* Org header */}
        <div className="flex items-center gap-2.5 px-2 pb-6 pt-2 border-b border-white/10 mb-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-amber-400 font-black text-sm shadow-md border border-white/10">
            E
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {user?.firstName ?? user?.email ?? "My Organization"}
            </p>
            <p className="text-[11px] text-slate-400">
              {user?.organizationId ? "Organization" : "No organization"}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-amber-500 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <Link
            href="my-organization/events/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
          <Link
            href="/profile"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Profile
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-5 sm:p-10 lg:p-12">
        {children}
      </main>
    </div>
  );
}
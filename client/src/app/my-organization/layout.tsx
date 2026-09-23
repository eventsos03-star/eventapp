"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/my-organization", icon: LayoutDashboard },
  { label: "Events", href: "/my-organization/events", icon: CalendarDays },
  { label: "Tasks & Operations", href: "/my-organization/tasks", icon: CheckSquare },
  { label: "Participants", href: "/my-organization/participants", icon: Users },
  { label: "Certificates", href: "/my-organization/certificates", icon: Award },
  { label: "Finance", href: "/my-organization/finance", icon: CircleDollarSign },
  { label: "Members", href: "/my-organization/members", icon: UserPlus },
  { label: "Venues", href: "/my-organization/venues", icon: MapPin },
];

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) =>
    href === "/my-organization" ? pathname === href : pathname?.startsWith(href);

  return (
    <div className="flex min-h-screen w-full bg-[#090d16] text-white font-sans antialiased">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0d1220] p-4">
        {/* Org Header */}
        <div className="flex items-center gap-2.5 px-2 pb-6 pt-2 border-b border-white/10 mb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 font-black text-slate-950 text-base shadow-lg shadow-amber-500/20">
            E
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {user?.firstName ?? "My Organization"}
            </p>
            <p className="text-[11px] text-amber-400 font-medium">
              {(user as any)?.orgRole ? (user as any).orgRole.replace("_", " ").toUpperCase() : "ORGANIZATION"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
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

        {/* Quick Actions */}
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <Link
            href="/my-organization/events/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
          <Link
            href="/profile"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
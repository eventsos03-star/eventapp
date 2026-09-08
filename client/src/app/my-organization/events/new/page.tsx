"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { eventService } from "@/lib/eventApi";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext"; // adjust path

// Adjust this to match your real Venue type/interface
interface Venue {
  _id: string;
  venueName: string;
  city?: string;
  status?: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user, initializing } = useAuth();

  const organizationId = (user as any)?.organizationId;
  const canCreateEvent = Boolean(organizationId);

  const [form, setForm] = useState({
    venueBookingId: "",
    eventName: "",
    description: "",
    eventType: "free" as "free" | "paid",
    registrationType: "individual" as "team" | "individual",
    maxParticipants: 50,
    registrationStartDate: "",
    registrationEndDate: "",
    eventDate: "",
    certificateEnabled: false,
    ticketPrice: "",
    teamSize: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!initializing && (!user || !canCreateEvent)) {
      notFound();
    }
  }, [initializing, user, canCreateEvent]);

  useEffect(() => {
    setVenuesLoading(true);
    api
      .listVenues()
      .then((res: any) => setVenues(res.data ?? []))
      .catch(() => setVenues([]))
      .finally(() => setVenuesLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!organizationId) {
      setError("You're not associated with an organization yet, so you can't create an event.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        organizationId,
        maxParticipants: Number(form.maxParticipants),
        ticketPrice: form.eventType === "paid" ? Number(form.ticketPrice) : undefined,
        teamSize: form.registrationType === "team" ? Number(form.teamSize) : undefined,
        venueBookingId: form.venueBookingId || undefined,
        registrationStartDate: new Date(form.registrationStartDate).toISOString(),
        registrationEndDate: new Date(form.registrationEndDate).toISOString(),
        eventDate: new Date(form.eventDate).toISOString(),
      };

      const res = await eventService.create(payload);
      router.push("my-organization");
      // router.push(`/events/${res.data._id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  if (initializing || !user || !canCreateEvent) {
    return (
      <div className="min-h-screen w-full bg-[#090d16] flex items-center justify-center text-slate-400 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#090d16] text-white font-sans antialiased flex flex-col justify-between p-5 sm:p-10 lg:p-12">
      {/* Background Glow Elements */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-2xl mx-auto my-auto py-6 sm:py-8">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base sm:text-lg shadow-md border border-white/10">
              E
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Event<span className="text-amber-500">OS</span>
            </span>
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            Event Creation Hub
          </span>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Create New <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">Draft Event</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Configure registration schedules, venue links, and ticketing options.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Venue Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Venue <span className="text-xs text-slate-500">(Optional)</span>
              </label>
              <select
                value={form.venueBookingId}
                onChange={(e) => update("venueBookingId", e.target.value)}
                disabled={venuesLoading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="" className="bg-slate-900 text-white">
                  {venuesLoading ? "Loading venues..." : "No venue selected"}
                </option>
{venues.map((v) => (
  <option key={v._id} value={v._id} className="bg-slate-900 text-white">
    {v.venueName}
    {v.city ? ` — ${v.city}` : ""}
  </option>
))}
              </select>
              {!venuesLoading && venues.length === 0 && (
                <p className="mt-1 text-[11px] text-slate-500">No venues available.</p>
              )}
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Event Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={form.eventName}
                onChange={(e) => update("eventName", e.target.value)}
                placeholder="e.g. Annual Tech Symposium 2026"
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description <span className="text-amber-400">*</span>
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Brief summary of the live event, topics, and venue schedules..."
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Type & Format Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pricing Model</label>
                <select
                  value={form.eventType}
                  onChange={(e) => update("eventType", e.target.value as "free" | "paid")}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="free" className="bg-slate-900 text-white">Free Event</option>
                  <option value="paid" className="bg-slate-900 text-white">Paid Pass</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registration Format</label>
                <select
                  value={form.registrationType}
                  onChange={(e) => update("registrationType", e.target.value as "team" | "individual")}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="individual" className="bg-slate-900 text-white">Individual Entry</option>
                  <option value="team" className="bg-slate-900 text-white">Team Entry</option>
                </select>
              </div>
            </div>

            {/* Dynamic Pricing / Team Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.eventType === "paid" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ticket Price ($) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={form.ticketPrice}
                    onChange={(e) => update("ticketPrice", e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}

              {form.registrationType === "team" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Team Size <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="2"
                    placeholder="e.g. 4"
                    value={form.teamSize}
                    onChange={(e) => update("teamSize", e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}

              <div className={form.eventType === "free" && form.registrationType === "individual" ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Capacity <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxParticipants}
                  onChange={(e) => update("maxParticipants", Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Date Time Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reg. Opens <span className="text-amber-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.registrationStartDate}
                  onChange={(e) => update("registrationStartDate", e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-xs text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 scheme-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reg. Closes <span className="text-amber-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.registrationEndDate}
                  onChange={(e) => update("registrationEndDate", e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-xs text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 scheme-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Event Starts <span className="text-amber-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(e) => update("eventDate", e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-xs text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 scheme-dark"
                />
              </div>
            </div>

            {/* Checkbox Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group rounded-xl border border-white/5 bg-slate-900/40 p-3 hover:bg-slate-900/60 transition">
                <input
                  type="checkbox"
                  checked={form.certificateEnabled}
                  onChange={(e) => update("certificateEnabled", e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Automated Certificate Issuance
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Auto-generate and email attendance certificates post-event
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
              ) : (
                <>Create Draft Event &rarr;</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
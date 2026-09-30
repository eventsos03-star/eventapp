"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { eventService, EventRecord } from "@/lib/eventApi";
import { useAuth } from "@/context/AuthContext";

export default function MyOrganizationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchEvents = () => {
    setLoading(true);
    eventService
      .byOrganization()
      .then((res) => setEvents(res.data))
      .catch((err) =>
        setError(err?.response?.data?.message ?? "Failed to load events")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((e) => e.status === "published").length;
    const ongoing = events.filter((e) => e.status === "ongoing").length;
    const completed = events.filter((e) => e.status === "completed").length;
    return { total, upcoming, ongoing, completed };
  }, [events]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event? This can't be undone.")) return;
    setActionId(id);
    try {
      await eventService.remove(id);
      fetchEvents();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to delete event");
    } finally {
      setActionId(null);
    }
  };

  const statusStyles: Record<string, string> = {
    draft: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    ongoing: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    completed: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#090d16] text-white font-sans antialiased p-5 sm:p-10 lg:p-12">
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-amber-400 font-black text-sm shadow-md border border-white/10">
                E
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Event<span className="text-amber-500">OS</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="text-amber-400">{user?.firstName ?? "there"}</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {user?.organizationId
                ? "Here's what's happening with your organization."
                : "You are not a member of an organization yet."}
            </p>
          </div>

          <Link
            href="/my-organization/events/new"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
          >
            + Create Event
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: stats.total },
            { label: "Published", value: stats.upcoming },
            { label: "Ongoing", value: stats.ongoing },
            { label: "Completed", value: stats.completed },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-[#111726]/80 p-5 backdrop-blur-xl"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {s.label}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#111726] animate-pulse"
              >
                <div className="h-36 bg-slate-800" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-1/3 rounded bg-slate-800" />
                  <div className="h-5 w-4/5 rounded bg-slate-800" />
                  <div className="h-3 w-full rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-12 text-center backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white">No events yet</h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Create your first event to get started.
            </p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => {
              // Extract string URL correctly from bannerImage object
              const image =
                (event as any).bannerImage?.url ||
                (typeof (event as any).bannerImage === "string" ? (event as any).bannerImage : undefined) ||
                (event as any).imageUrl ||
                (event as any).image;

              return (
                <div
                  key={event._id}
                  onClick={() => router.push(`/my-organization/events/${event._id}`)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#111726] transition duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-xl hover:shadow-black/30"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden bg-[#1a2232]">
                    {image ? (
                      <img
                        src={image}
                        alt={event.eventName}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <span className="text-3xl font-black text-amber-500/30">
                          EVENT
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    <span
                      className={`absolute left-2 top-2 inline-flex items-center rounded-md border px-2 py-1 text-[9px] font-bold uppercase capitalize shadow ${
                        statusStyles[event.status]
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex min-h-[190px] flex-col p-4">
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                          />
                        </svg>
                        {new Date(event.eventDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>

                      <h3 className="line-clamp-2 text-base font-bold leading-tight text-white transition group-hover:text-amber-400">
                        {event.eventName}
                      </h3>
                    </div>

                    {/* Bottom */}
                    <div className="mt-auto pt-4">
                      <div className="mb-3 flex items-center justify-between border-t border-white/5 pt-3">
                        <div>
                          <p className="text-[9px] text-slate-600">Capacity</p>
                          <p className="text-[10px] font-medium text-slate-300">
                            {event.maxParticipants || 0} seats
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/my-organization/events/${event._id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[10px] font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                        >
                          Edit
                        </Link>
                        <button
                          disabled={actionId === event._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event._id);
                          }}
                          className="flex flex-1 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-[10px] font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
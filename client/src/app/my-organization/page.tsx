"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { eventService, EventRecord } from "@/lib/eventApi";
import { useAuth } from "@/context/AuthContext";

export default function MyOrganizationPage() {
  const { user } = useAuth();
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
    const now = new Date();
    const total = events.length;
    const upcoming = events.filter(
      (e) => new Date(e.eventDate) >= now && e.status === "published"
    ).length;
    const completed = events.filter((e) => e.status === "completed").length;
    const drafts = events.filter((e) => e.status === "draft").length;
    return { total, upcoming, completed, drafts };
  }, [events]);

  const handlePublish = async (id: string) => {
    setActionId(id);
    try {
      await eventService.publish(id);
      fetchEvents();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to publish event");
    } finally {
      setActionId(null);
    }
  };

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

  const statusBadge = (status: EventRecord["status"]) => {
    const styles: Record<string, string> = {
      draft: "border-slate-500/30 bg-slate-500/10 text-slate-300",
      published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      ongoing: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      completed: "border-sky-500/30 bg-sky-500/10 text-sky-400",
      cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${styles[status]}`}
      >
        {status}
      </span>
    );
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
              Welcome back, <span className="text-amber-400">{user?.name ?? "there"}</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {user?.organizationName
                ? `Here's what's happening with ${user.organizationName}.`
                : "Manage your organization's events."}
            </p>
          </div>

          <Link
            href="my-organization/events/new"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
          >
            + Create Event
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: stats.total },
            { label: "Upcoming Events", value: stats.upcoming },
            { label: "Completed", value: stats.completed },
            { label: "Drafts", value: stats.drafts },
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
          <div className="rounded-2xl border border-white/5 bg-[#111726]/40 p-6 animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-800/60 rounded" />
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

        {/* Events Table */}
        {!loading && !error && events.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#111726]/80 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Your Events</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-white/5">
                    <th className="px-6 py-3 font-semibold">Event Name</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Capacity</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event._id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {event.eventName}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {new Date(event.eventDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">{statusBadge(event.status)}</td>
                      <td className="px-6 py-4 text-slate-300">
                        {event.maxParticipants}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                          <Link
                            href={`my-organization/events/${event._id}/edit`}
                            className="text-slate-300 hover:text-white"
                          >
                            Edit
                          </Link>
                          {event.status === "draft" && (
                            <button
                              disabled={actionId === event._id}
                            //   onClick={() => handlePublish(event._id)}
                              className="text-amber-400 hover:text-amber-300 disabled:opacity-40"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            disabled={actionId === event._id}
                            onClick={() => handleDelete(event._id)}
                            className="text-red-400 hover:text-red-300 disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
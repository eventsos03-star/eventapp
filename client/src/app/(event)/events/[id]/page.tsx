"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { eventService, type EventRecord } from "@/lib/eventApi";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"publish" | "delete" | null>(null);

  useEffect(() => {
    let cancelled = false;

    eventService
      .getById(id)
      .then((res) => {
        if (!cancelled) {
          setEvent(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? "Failed to load event");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handlePublish() {
    setActionLoading("publish");
    try {
      const res = await eventService.publish(id);
      setEvent(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to publish event");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this event? This can't be undone.")) return;
    setActionLoading("delete");
    try {
      await eventService.remove(id);
      router.push("/events");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to delete event");
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] p-5 sm:p-10 lg:p-12">
        <div className="max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/4" />
          <div className="h-10 bg-slate-800 rounded w-2/3" />
          <div className="h-40 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#090d16] p-5 sm:p-10 lg:p-12">
        <div className="max-w-3xl mx-auto rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm font-medium text-red-400">{error ?? "Event not found"}</p>
          <Link href="/events" className="mt-4 inline-block text-xs text-amber-400 hover:underline">
            &larr; Back to events
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = event.eventType === "paid";
  const statusColor =
    event.status === "published"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : event.status === "draft"
      ? "border-slate-500/30 bg-slate-500/10 text-slate-300"
      : "border-amber-500/30 bg-amber-500/10 text-amber-400";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#090d16] text-white font-sans antialiased p-5 sm:p-10 lg:p-12">
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        <Link href="/events" className="text-xs text-slate-400 hover:text-amber-400 transition">
          &larr; Back to events
        </Link>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${statusColor}`}>
              {event.status}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                isPaid
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {isPaid ? `$${event.ticketPrice ?? "0"} Ticket` : "Free Entry"}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {event.eventName}
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{event.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Event Date</span>
              <span className="text-slate-200 font-semibold">
                {new Date(event.eventDate).toLocaleDateString(undefined, {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Registration</span>
              <span className="text-slate-200 font-semibold capitalize">{event.registrationType}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Capacity</span>
              <span className="text-slate-200 font-semibold">{event.maxParticipants} max</span>
            </div>
            {event.registrationType === "team" && (
              <div>
                <span className="text-slate-500 block mb-1">Team Size</span>
                <span className="text-slate-200 font-semibold">{event.teamSize}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block mb-1">Reg. Opens</span>
              <span className="text-slate-200 font-semibold">
                {new Date(event.registrationStartDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Reg. Closes</span>
              <span className="text-slate-200 font-semibold">
                {new Date(event.registrationEndDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Organizer actions — only relevant while not published/complete */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
            {event.status === "draft" && (
              <button
                onClick={handlePublish}
                disabled={actionLoading !== null}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition disabled:opacity-60"
              >
                {actionLoading === "publish" ? "Publishing..." : "Publish Event"}
              </button>
            )}

            <Link
              href={`/events/${event._id}/edit`}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Edit
            </Link>

            <button
              onClick={handleDelete}
              disabled={actionLoading !== null}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition disabled:opacity-60"
            >
              {actionLoading === "delete" ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  Ticket,
  CheckCircle2,
  Globe2,
  Wifi,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";

import { eventService, type EventRecord } from "@/lib/eventApi";

export default function OrgEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvent = () => {
    setLoading(true);
    eventService
      .getById(id)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message ?? "Failed to load event");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePublish = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      await eventService.publish(event._id);
      fetchEvent();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to publish event");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm("Delete this event? This can't be undone.")) return;
    setActionLoading(true);
    try {
      await eventService.remove(event._id);
      router.push("/my-organization/events");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to delete event");
      setActionLoading(false);
    }
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] px-4 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-4 w-32 rounded bg-slate-800" />

          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-[#111726] lg:grid-cols-2">
            <div className="h-[300px] bg-slate-800 lg:h-[400px]" />

            <div className="space-y-5 p-6">
              <div className="h-5 w-24 rounded bg-slate-800" />
              <div className="h-8 w-3/4 rounded bg-slate-800" />
              <div className="h-16 w-full rounded bg-slate-800" />

              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 rounded bg-slate-800" />
                <div className="h-10 rounded bg-slate-800" />
                <div className="h-10 rounded bg-slate-800" />
                <div className="h-10 rounded bg-slate-800" />
              </div>

              <div className="h-11 rounded bg-slate-800" />
            </div>
          </div>

          <div className="h-48 rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#090d16] px-4 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-[#111726] p-10 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-400">
            !
          </div>

          <h2 className="text-lg font-bold text-white">Event not found</h2>

          <p className="mt-2 text-sm text-slate-500">
            {error ?? "The requested event could not be found."}
          </p>

          <Link
            href="/my-organization/events"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = event.eventType === "paid";

  const eventImage =
    (event as any).imageUrl || (event as any).image || (event as any).bannerImage;

  const eventDate = new Date(event.eventDate);

  const formattedDate = eventDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const registrationEnd = event.registrationEndDate
    ? new Date(event.registrationEndDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not specified";

  const statusColor =
    event.status === "published"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : event.status === "draft"
        ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
        : event.status === "cancelled"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-amber-500/10 text-amber-400 border-amber-500/20";

  const venue = (event as any).venueBookingId?.venueId;
  const venueName = venue?.venueName;
  const location = venue?.location;

  const formattedLocation =
    location?.formattedAddress ||
    [location?.city, location?.state].filter(Boolean).join(", ");

  const coordinates = location?.coordinates;

  const googleMapsUrl =
    coordinates?.length === 2
      ? `https://www.google.com/maps/search/?api=1&query=${coordinates[1]},${coordinates[0]}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          formattedLocation || venueName || ""
        )}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090d16] text-white font-sans antialiased">
      {/* Background glow */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[130px]" />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-8 lg:px-10">
        {/* BACK */}
        <Link
          href="/my-organization/events"
          className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        {/* HERO */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111726]/90 shadow-2xl backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1.4fr_1fr]">
            {/* IMAGE */}
            <div className="relative min-h-[280px] bg-[#151d2c] sm:min-h-[360px] lg:min-h-[440px]">
              {eventImage ? (
                <img
                  src={eventImage}
                  alt={event.eventName}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                  <span className="text-5xl font-black tracking-widest text-amber-500/20">
                    EVENT
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16]/70 via-transparent to-transparent" />

              <div className="absolute bottom-4 left-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${statusColor}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {event.status}
                </span>
              </div>
            </div>

            {/* EVENT SUMMARY */}
            <div className="flex flex-col p-5 sm:p-7 lg:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide border ${
                    isPaid
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {isPaid ? "Paid Event" : "Free Event"}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                {event.eventName}
              </h1>

              <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
                {event.description}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 border-y border-white/5 py-5 sm:grid-cols-2">
                <EventInfo
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Date"
                  value={formattedDate}
                />

                <EventInfo
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location"
                  value={formattedLocation || "Location not specified"}
                />

                <EventInfo
                  icon={<Users className="h-4 w-4" />}
                  label="Capacity"
                  value={`${event.availableSeats} seats left (${event.maxParticipants} total)`}
                />

                <EventInfo
                  icon={<Ticket className="h-4 w-4" />}
                  label="Registered"
                  value={`${event.registeredCount ?? 0} participants`}
                />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500">Ticket Price</p>
                  <p
                    className={`mt-0.5 text-xl font-extrabold ${
                      isPaid ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {isPaid ? `₹${event.ticketPrice ?? "0"}` : "Free"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Registration closes</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-300">
                    {registrationEnd}
                  </p>
                </div>
              </div>

              {/* Organizer actions */}
              <div className="mt-6 flex items-center gap-2">
                <Link
                  href={`/my-organization/events/${event._id}/edit`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-xs font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>

                {event.status === "draft" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handlePublish}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/10 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Publish
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDelete}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-xs font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* ABOUT */}
            <section className="rounded-2xl border border-white/10 bg-[#111726]/80 p-5 backdrop-blur-xl sm:p-7">
              <SectionTitle
                icon={<CheckCircle2 className="h-4 w-4" />}
                title="About This Event"
              />

              <div className="mt-5 space-y-4">
                <p className="text-sm leading-7 text-slate-400">
                  {event.description || "No description provided."}
                </p>
              </div>
            </section>

            {/* EVENT SCHEDULE */}
            <section className="rounded-2xl border border-white/10 bg-[#111726]/80 p-5 backdrop-blur-xl sm:p-7">
              <SectionTitle icon={<Clock3 className="h-4 w-4" />} title="Event Schedule" />

              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-xs font-semibold text-amber-400">
                      Event Date & Time
                    </p>
                    <p className="mt-1 text-sm text-slate-300">{formattedDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-slate-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Registration Deadline
                    </p>
                    <p className="mt-1 text-sm text-slate-300">{registrationEnd}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Event Status</p>
                    <p className="mt-1 text-sm capitalize text-slate-300">
                      {event.status}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* VENUE */}
            <section className="rounded-2xl border border-white/10 bg-[#111726]/80 p-5 backdrop-blur-xl sm:p-7">
              <SectionTitle icon={<MapPin className="h-4 w-4" />} title="Venue" />

              <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_260px] sm:items-center">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {venueName || "Event Venue"}
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {formattedLocation || "No venue information available."}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.03] px-2 py-1 text-[9px] text-slate-500">
                      <Wifi className="h-3 w-3" />
                      Wi-Fi
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.03] px-2 py-1 text-[9px] text-slate-500">
                      <MapPin className="h-3 w-3" />
                      Parking
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.03] px-2 py-1 text-[9px] text-slate-500">
                      <Globe2 className="h-3 w-3" />
                      Accessible
                    </span>
                  </div>
                </div>

                <div className="relative h-48 overflow-hidden rounded-xl border border-white/10 bg-[#0d1320]">
                  {coordinates?.length === 2 ? (
                    <iframe
                      title={`${venueName || "Venue"} location`}
                      src={`https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}&z=15&output=embed`}
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">
                      Location unavailable
                    </div>
                  )}

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 rounded-lg bg-amber-500 px-3 py-2 text-[10px] font-bold text-slate-950 shadow-lg transition hover:bg-amber-400"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="space-y-6">
            <section className="sticky top-6 rounded-2xl border border-white/10 bg-[#111726]/90 p-5 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white">Event Overview</h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs text-slate-500">Fee</span>
                  <span
                    className={`text-xs font-bold ${
                      isPaid ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {isPaid ? `₹${event.ticketPrice ?? "0"}` : "Free"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs text-slate-500">Total Seats</span>
                  <span className="text-xs font-bold text-slate-300">
                    {event.maxParticipants}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs text-slate-500">Available Seats</span>
                  <span
                    className={`text-xs font-bold ${
                      event.availableSeats === 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {event.availableSeats}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs text-slate-500">Registered</span>
                  <span className="text-xs font-bold text-slate-300">
                    {event.registeredCount ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Registration Type</span>
                  <span className="text-xs font-semibold capitalize text-slate-300">
                    {event.registrationType}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Link
                  href={`/my-organization/events/${event._id}/edit`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-xs font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Event
                </Link>

                {event.status === "draft" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handlePublish}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Publish Event
                  </button>
                )}
              </div>

              <p className="mt-3 text-center text-[9px] text-slate-600">
                Registration closes on {registrationEnd}
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ==================================================
   SMALL COMPONENTS
================================================== */

function EventInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-amber-400">{icon}</div>

      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wide text-slate-600">{label}</p>
        <p className="mt-1 truncate text-xs font-semibold text-slate-300">{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-amber-400">{icon}</span>
      <h2 className="text-sm font-bold text-white sm:text-base">{title}</h2>
    </div>
  );
}
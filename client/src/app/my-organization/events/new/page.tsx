
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { eventService } from "@/lib/eventApi";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Venue {
  _id: string;
  venueName: string;
  city?: string;
  status?: string;
}

interface VenueAvailability {
  startDate: string;
  endDate: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user, initializing } = useAuth();

  const organizationId = (user as any)?.organizationId;
  const canCreateEvent = Boolean(organizationId);

  const [form, setForm] = useState({
    venueId: "",
    eventName: "",
    description: "",
    eventType: "free" as "free" | "paid",
    registrationType: "individual" as "team" | "individual",
    maxParticipants: 50,
    registrationStartDate: "",
    registrationEndDate: "",
    eventDate: "",
    eventEndDate: "",
    certificateEnabled: false,
    ticketPrice: "",
    teamSize: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);

  const [bookedDates, setBookedDates] = useState<VenueAvailability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  /*
   * Calendar month currently being displayed.
   */
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  /*
   * Authentication / organization check
   */
  useEffect(() => {
    if (!initializing && (!user || !canCreateEvent)) {
      notFound();
    }
  }, [initializing, user, canCreateEvent]);

  /*
   * Fetch venues
   */
  useEffect(() => {
    setVenuesLoading(true);

    api
      .listVenues()
      .then((res: any) => {
        setVenues(res.data ?? []);
      })
      .catch(() => {
        setVenues([]);
      })
      .finally(() => {
        setVenuesLoading(false);
      });
  }, []);

  /*
   * Fetch availability whenever venue changes.
   */
  useEffect(() => {
    if (!form.venueId) {
      setBookedDates([]);
      return;
    }

    async function fetchAvailability() {
      try {
        setAvailabilityLoading(true);
        setError(null);

        const res = await eventService.getVenueAvailability(
          form.venueId
        );

        /*
         * Supports either:
         *
         * res = { data: [...] }
         *
         * or
         *
         * res = [...]
         */
        setBookedDates(res?.data ?? res ?? []);
      } catch (err: any) {
        console.error("Failed to fetch venue availability:", err);

        setBookedDates([]);

        setError(
          err?.response?.data?.message ??
            "Failed to load venue availability"
        );
      } finally {
        setAvailabilityLoading(false);
      }
    }

    fetchAvailability();
  }, [form.venueId]);

  /*
   * Convert a Date into YYYY-MM-DD.
   *
   * We deliberately use local date parts here because the calendar
   * represents calendar days rather than timestamps.
   */
function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

  /*
   * Convert an ISO date/string into a local calendar date.
   */
  function toDateOnly(value: string | Date) {
    const date = new Date(value);

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  }

  /*
   * Determine whether a calendar date falls inside an approved
   * booking range.
   */
  function isDateBooked(date: Date) {
    const selectedKey = formatDateKey(date);

    return bookedDates.some((booking) => {
      const start = toDateOnly(booking.startDate);
      const end = toDateOnly(booking.endDate);

      const startKey = formatDateKey(start);
      const endKey = formatDateKey(end);

      return selectedKey >= startKey && selectedKey <= endKey;
    });
  }

  /*
   * Determine whether a date is before today.
   */
  function isDateInPast(date: Date) {
    const today = new Date();

    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    return dateOnly < todayOnly;
  }

  /*
   * Calendar data.
   *
   * Sunday = 0
   * Monday = 1
   * ...
   * Saturday = 6
   */
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    const numberOfDays = lastDay.getDate();

    const days: (Date | null)[] = [];

    /*
     * Empty cells before the first day.
     */
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    /*
     * Actual month days.
     */
    for (let day = 1; day <= numberOfDays; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [calendarMonth]);

  const monthLabel = calendarMonth.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  /*
   * Move calendar one month backward.
   */
  function previousMonth() {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() - 1,
        1
      )
    );
  }

  /*
   * Move calendar one month forward.
   */
  function nextMonth() {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        1
      )
    );
  }

  /*
   * Determine whether a whole day range is fully available
   * (no past or booked dates inside it).
   */
  function isRangeClear(startKey: string, endKey: string) {
    const start = toDateOnly(
      new Date(`${startKey}T00:00:00`)
    );
    const end = toDateOnly(
      new Date(`${endKey}T00:00:00`)
    );

    const cursor = new Date(start);

    while (cursor <= end) {
      if (isDateInPast(cursor) || isDateBooked(cursor)) {
        return false;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return true;
  }

  /*
   * Select an available date.
   *
   * Multi-day support: the first click sets the range start, the
   * second click sets the range end. A third click starts a new
   * range.
   */
  function selectEventDate(date: Date) {
    if (!form.venueId) {
      setError("Please select a venue first.");
      return;
    }

    if (isDateInPast(date)) {
      return;
    }

    if (isDateBooked(date)) {
      return;
    }

    const dateKey = formatDateKey(date);

    if (!form.eventDate) {
      setForm((f) => ({
        ...f,
        eventDate: dateKey,
        eventEndDate: "",
      }));
    } else if (!form.eventEndDate) {
      let startKey = form.eventDate;
      let endKey = dateKey;

      if (dateKey < form.eventDate) {
        startKey = dateKey;
        endKey = form.eventDate;
      }

      if (!isRangeClear(startKey, endKey)) {
        setError(
          "The selected range includes an unavailable date. Please choose a different end date."
        );
        return;
      }

      setForm((f) => ({
        ...f,
        eventDate: startKey,
        eventEndDate: endKey,
      }));
    } else {
      setForm((f) => ({
        ...f,
        eventDate: dateKey,
        eventEndDate: "",
      }));
    }

    setError(null);
  }

  /*
   * Submit event.
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!organizationId) {
      setError(
        "You're not associated with an organization yet, so you can't create an event."
      );
      return;
    }

    if (!form.venueId) {
      setError("Please select a venue.");
      return;
    }

    if (!form.eventDate) {
      setError("Please select an available event date.");
      return;
    }

    /*
     * Frontend availability check.
     *
     * This is only a UX check. The backend MUST check availability
     * again because another user may have booked the venue after
     * this calendar was loaded.
     */
    const startKey = form.eventDate;
    const endKey = form.eventEndDate || form.eventDate;

    if (!isRangeClear(startKey, endKey)) {
      setError(
        "This venue is no longer available on the selected date range. Please choose another date."
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        organizationId,
        venueId: form.venueId,

        eventName: form.eventName,
        description: form.description,

        eventType: form.eventType,
        registrationType: form.registrationType,

        maxParticipants: Number(form.maxParticipants),

        ticketPrice:
          form.eventType === "paid"
            ? Number(form.ticketPrice)
            : undefined,

        teamSize:
          form.registrationType === "team"
            ? Number(form.teamSize)
            : undefined,

        certificateEnabled: form.certificateEnabled,

        registrationStartDate: new Date(
          form.registrationStartDate
        ).toISOString(),

        registrationEndDate: new Date(
          form.registrationEndDate
        ).toISOString(),

        eventDate: new Date(
          `${form.eventDate}T00:00:00`
        ).toISOString(),

        eventEndDate: form.eventEndDate
          ? new Date(
              `${form.eventEndDate}T00:00:00`
            ).toISOString()
          : undefined,
      };

      await eventService.create(payload);

      router.push("/my-organization");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Failed to create event"
      );
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

          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
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

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#111726]/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Create New{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              Draft Event
            </span>
          </h1>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Configure registration schedules, venue links, and ticketing options.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-400">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >

            {/* Venue Selection */}
            <div>

              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Venue <span className="text-amber-400">*</span>
              </label>

              <select
                value={form.venueId}
                onChange={(e) => {
                  update("venueId", e.target.value);
                  update("eventDate", "");
                  update("eventEndDate", "");
                }}
                disabled={venuesLoading}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >

                <option
                  value=""
                  className="bg-slate-900 text-white"
                >
                  {venuesLoading
                    ? "Loading venues..."
                    : "Select a venue"}
                </option>

                {venues.map((v) => (
                  <option
                    key={v._id}
                    value={v._id}
                    className="bg-slate-900 text-white"
                  >
                    {v.venueName}
                    {v.city ? ` — ${v.city}` : ""}
                  </option>
                ))}

              </select>

              {!venuesLoading && venues.length === 0 && (
                <p className="mt-1 text-[11px] text-slate-500">
                  No venues available.
                </p>
              )}

            </div>

            {/* Venue Availability Calendar */}
            {form.venueId && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:p-5">

                <div className="flex items-center justify-between mb-4">

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Venue Availability
                    </h2>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Select a start date, then an end date for multi-day events (one date = single day).
                    </p>
                  </div>

                  {availabilityLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
                  )}

                </div>

                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">

                  <button
                    type="button"
                    onClick={previousMonth}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    aria-label="Previous month"
                  >
                    ←
                  </button>

                  <h3 className="text-sm font-bold text-white">
                    {monthLabel}
                  </h3>

                  <button
                    type="button"
                    onClick={nextMonth}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    aria-label="Next month"
                  >
                    →
                  </button>

                </div>

                {/* Weekday Names */}
                <div className="grid grid-cols-7 gap-1.5 mb-1.5">

                  {[
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                  ].map((day) => (
                    <div
                      key={day}
                      className="text-center text-[10px] font-semibold text-slate-500 py-2"
                    >
                      {day}
                    </div>
                  ))}

                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1.5">

                  {calendarDays.map((date, index) => {

                    if (!date) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="aspect-square"
                        />
                      );
                    }

                    const dateKey = formatDateKey(date);

                    const booked = isDateBooked(date);
                    const past = isDateInPast(date);

                    const rangeActive =
                      form.eventDate && form.eventEndDate;
                    const inRange =
                      rangeActive &&
                      dateKey >= form.eventDate &&
                      dateKey <= form.eventEndDate;
                    const isEndpoint =
                      form.eventDate === dateKey ||
                      (form.eventEndDate &&
                        form.eventEndDate === dateKey);
                    const selected =
                      form.eventDate === dateKey;

                    const disabled =
                      booked || past || availabilityLoading;

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectEventDate(date)}
                        className={[
                          "relative aspect-square rounded-lg text-xs font-semibold transition",
                          "border",

                          inRange && isEndpoint
                            ? "border-amber-400 bg-amber-500 text-slate-950"
                            : inRange
                              ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                              : selected
                                ? "border-amber-400 bg-amber-500 text-slate-950"
                                : booked
                                  ? "border-red-500/30 bg-red-500/20 text-red-400 cursor-not-allowed"
                                  : past
                                    ? "border-white/5 bg-slate-900/30 text-slate-700 cursor-not-allowed"
                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/20",

                          disabled && !selected
                            ? "cursor-not-allowed"
                            : "",
                        ].join(" ")}
                        title={
                          booked
                            ? "Already booked"
                            : past
                              ? "Date has passed"
                              : inRange && isEndpoint
                                ? "Selected event range"
                                : inRange
                                  ? "Selected event range"
                                  : selected
                                    ? "Selected event date"
                                    : "Available"
                        }
                      >
                        {date.getDate()}

                        {booked && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-red-400" />
                        )}

                      </button>
                    );
                  })}

                </div>

                {/* Legend */}
                <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">

                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-emerald-500/20 border border-emerald-500/30" />
                    Available
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-red-500/20 border border-red-500/30" />
                    Booked
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-amber-500" />
                    Selected
                  </div>

                </div>

                {/* Selected Date */}
                {form.eventDate && (
                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">

                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                      Selected Event Date{form.eventEndDate ? " Range" : ""}
                    </p>

                    <p className="mt-1 text-sm font-bold text-amber-400">
                      {form.eventEndDate
                        ? `${new Date(
                            `${form.eventDate}T00:00:00`
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                          })} – ${new Date(
                            `${form.eventEndDate}T00:00:00`
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}, ${new Date(
                            `${form.eventEndDate}T00:00:00`
                          ).getFullYear()}`
                        : new Date(
                            `${form.eventDate}T00:00:00`
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                    </p>

                    {!form.eventEndDate && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        Pick one more date to set an end date
                        (multi-day event).
                      </p>
                    )}

                  </div>
                )}

              </div>
            )}

            {/* Event Name */}
            <div>

              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Event Name <span className="text-amber-400">*</span>
              </label>

              <input
                type="text"
                value={form.eventName}
                onChange={(e) =>
                  update("eventName", e.target.value)
                }
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
                onChange={(e) =>
                  update("description", e.target.value)
                }
                placeholder="Brief summary of the live event, topics, and venue schedules..."
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />

            </div>

            {/* Type & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>

                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pricing Model
                </label>

                <select
                  value={form.eventType}
                  onChange={(e) =>
                    update(
                      "eventType",
                      e.target.value as "free" | "paid"
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  <option
                    value="free"
                    className="bg-slate-900 text-white"
                  >
                    Free Event
                  </option>

                  <option
                    value="paid"
                    className="bg-slate-900 text-white"
                  >
                    Paid Pass
                  </option>
                </select>

              </div>

              <div>

                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registration Format
                </label>

                <select
                  value={form.registrationType}
                  onChange={(e) =>
                    update(
                      "registrationType",
                      e.target.value as
                        | "team"
                        | "individual"
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  <option
                    value="individual"
                    className="bg-slate-900 text-white"
                  >
                    Individual Entry
                  </option>

                  <option
                    value="team"
                    className="bg-slate-900 text-white"
                  >
                    Team Entry
                  </option>
                </select>

              </div>

            </div>

            {/* Dynamic Pricing / Team Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {form.eventType === "paid" && (
                <div>

                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ticket Price ($){" "}
                    <span className="text-amber-400">*</span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={form.ticketPrice}
                    onChange={(e) =>
                      update("ticketPrice", e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />

                </div>
              )}

              {form.registrationType === "team" && (
                <div>

                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Team Size{" "}
                    <span className="text-amber-400">*</span>
                  </label>

                  <input
                    type="number"
                    min="2"
                    placeholder="e.g. 4"
                    value={form.teamSize}
                    onChange={(e) =>
                      update("teamSize", e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />

                </div>
              )}

              <div
                className={
                  form.eventType === "free" &&
                  form.registrationType === "individual"
                    ? "sm:col-span-2"
                    : ""
                }
              >

                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Capacity{" "}
                  <span className="text-amber-400">*</span>
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.maxParticipants}
                  onChange={(e) =>
                    update(
                      "maxParticipants",
                      Number(e.target.value)
                    )
                  }
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />

              </div>

            </div>

            {/* Registration Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>

                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reg. Opens{" "}
                  <span className="text-amber-400">*</span>
                </label>

                <input
                  type="datetime-local"
                  value={form.registrationStartDate}
                  onChange={(e) =>
                    update(
                      "registrationStartDate",
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-xs text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 scheme-dark"
                />

              </div>

              <div>

                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reg. Closes{" "}
                  <span className="text-amber-400">*</span>
                </label>

                <input
                  type="datetime-local"
                  value={form.registrationEndDate}
                  onChange={(e) =>
                    update(
                      "registrationEndDate",
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-xs text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 scheme-dark"
                />

              </div>

            </div>

            {/* Certificate */}
            <div className="pt-2">

              <label className="flex items-center gap-3 cursor-pointer group rounded-xl border border-white/5 bg-slate-900/40 p-3 hover:bg-slate-900/60 transition">

                <input
                  type="checkbox"
                  checked={form.certificateEnabled}
                  onChange={(e) =>
                    update(
                      "certificateEnabled",
                      e.target.checked
                    )
                  }
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

            {/* Submit */}
            <button
              type="submit"
              disabled={
                loading ||
                availabilityLoading ||
                !form.venueId ||
                !form.eventDate
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
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


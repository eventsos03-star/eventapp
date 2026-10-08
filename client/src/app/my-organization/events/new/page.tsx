"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, notFound } from "next/navigation";
import { eventService } from "@/lib/eventApi";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Venue } from "@/types";
import { Building2, MapPin, Users, DollarSign, CreditCard, AlertCircle, X } from "lucide-react";

interface VenueAvailability {
  startDate: string;
  endDate: string;
}

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-sm">Loading event creator...</span>
          </div>
        </div>
      }
    >
      <CreateEventPageInner />
    </Suspense>
  );
}

function CreateEventPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, initializing } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const venueIdParam = searchParams.get("venueId");

  const organizationId = (user as any)?.organizationId;
  const canCreateEvent = Boolean(organizationId);

  const [form, setForm] = useState({
    venueId: venueIdParam || "",
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

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);

  const [bookedDates, setBookedDates] = useState<VenueAvailability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Currently selected venue object
  const selectedVenue = useMemo(
    () => venues.find((v) => v._id === form.venueId),
    [venues, form.venueId]
  );

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // Auto-dismiss error toast after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  // Handle banner image selection
  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Banner image cannot exceed 5 MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"].includes(file.type)) {
      setError("Only JPEG, PNG, GIF, WebP and AVIF formats are allowed.");
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleRemoveImage() {
    setBannerFile(null);
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
      setBannerPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    return () => {
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview]);

  useEffect(() => {
    if (!initializing && (!user || !canCreateEvent)) {
      notFound();
    }
  }, [initializing, user, canCreateEvent]);

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

  useEffect(() => {
    if (!form.venueId) {
      setBookedDates([]);
      return;
    }

    async function fetchAvailability() {
      try {
        setAvailabilityLoading(true);
        setError(null);

        const res = await eventService.getVenueAvailability(form.venueId);
        setBookedDates(res?.data ?? res ?? []);
      } catch (err: any) {
        setBookedDates([]);
        setError(err?.response?.data?.message ?? "Failed to load venue availability");
      } finally {
        setAvailabilityLoading(false);
      }
    }

    fetchAvailability();
  }, [form.venueId]);

  function formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function toDateOnly(value: string | Date) {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

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

  function isDateInPast(date: Date) {
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dateOnly < todayOnly;
  }

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const numberOfDays = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= numberOfDays; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [calendarMonth]);

  const monthLabel = calendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function previousMonth() {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  }

  function isRangeClear(startKey: string, endKey: string) {
    const start = toDateOnly(new Date(`${startKey}T00:00:00`));
    const end = toDateOnly(new Date(`${endKey}T00:00:00`));
    const cursor = new Date(start);

    while (cursor <= end) {
      if (isDateInPast(cursor) || isDateBooked(cursor)) {
        return false;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return true;
  }

  function selectEventDate(date: Date) {
    if (!form.venueId) {
      setError("Please select a venue first.");
      return;
    }

    if (isDateInPast(date) || isDateBooked(date)) {
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
        setError("The selected range includes an unavailable date. Please choose a different end date.");
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!organizationId) {
      setError("You're not associated with an organization yet, so you can't create an event.");
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

    if (!form.eventName.trim()) {
      setError("Please enter an event name.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (form.eventType === "paid" && (!form.ticketPrice || Number(form.ticketPrice) <= 0)) {
      setError("Please enter a valid ticket price.");
      return;
    }

    if (form.registrationType === "team" && (!form.teamSize || Number(form.teamSize) < 2)) {
      setError("Team size must be at least 2.");
      return;
    }

    if (!form.maxParticipants || Number(form.maxParticipants) < 1) {
      setError("Max capacity must be at least 1.");
      return;
    }

    if (selectedVenue && Number(form.maxParticipants) > selectedVenue.capacity) {
      setError(`Max participants cannot exceed the venue capacity (${selectedVenue.capacity} seats).`);
      return;
    }

    if (!form.registrationStartDate || !form.registrationEndDate) {
      setError("Please set the registration open and close dates.");
      return;
    }

    if (new Date(form.registrationEndDate) < new Date(form.registrationStartDate)) {
      setError("Registration close date must be after the open date.");
      return;
    }

    const startKey = form.eventDate;
    const endKey = form.eventEndDate || form.eventDate;

    if (!isRangeClear(startKey, endKey)) {
      setError("This venue is no longer available on the selected date range. Please choose another date.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("organizationId", organizationId);
      formData.append("venueId", form.venueId);
      formData.append("eventName", form.eventName);
      formData.append("description", form.description);
      formData.append("eventType", form.eventType);
      formData.append("registrationType", form.registrationType);
      formData.append("maxParticipants", String(form.maxParticipants));

      if (form.eventType === "paid" && form.ticketPrice) {
        formData.append("ticketPrice", String(form.ticketPrice));
      }

      if (form.registrationType === "team" && form.teamSize) {
        formData.append("teamSize", String(form.teamSize));
      }

      formData.append("certificateEnabled", String(form.certificateEnabled));
      formData.append("registrationStartDate", new Date(form.registrationStartDate).toISOString());
      formData.append("registrationEndDate", new Date(form.registrationEndDate).toISOString());
      formData.append("eventDate", new Date(`${form.eventDate}T00:00:00`).toISOString());

      if (form.eventEndDate) {
        formData.append("eventEndDate", new Date(`${form.eventEndDate}T00:00:00`).toISOString());
      }

      if (bannerFile) {
        formData.append("bannerImage", bannerFile);
      }

      await eventService.create(formData);
      router.push("/my-organization/events");
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
      {/* Error Toast */}
      {error && (
        <div
          role="alert"
          className="fixed top-4 right-4 left-4 sm:left-auto z-50 sm:w-96 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-600 px-4 py-3 text-sm text-white shadow-2xl shadow-red-900/40"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="flex-1 text-xs sm:text-sm font-medium leading-snug">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="shrink-0 rounded-md p-0.5 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute -top-20 -right-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-2xl mx-auto my-auto py-6 sm:py-8">
        <Link
          href="/my-organization/events"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition mb-6"
        >
          &larr; Back to Events
        </Link>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Create New Event</h1>
            <p className="mt-1 text-xs text-slate-400">
              Host your next event, select an approved venue, and set registration rules.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Banner Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Event Banner Image <span className="text-slate-500">(Optional, Max 5 MB)</span>
              </label>

              {bannerPreview ? (
                <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 aspect-video w-full max-h-52 flex items-center justify-center">
                  <img
                    src={bannerPreview}
                    alt="Event banner preview"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-slate-700 transition"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-red-500 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-white/15 hover:border-amber-400/50 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl p-6 text-center transition flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="h-10 w-10 rounded-full bg-white/5 group-hover:bg-amber-500/10 flex items-center justify-center text-slate-400 group-hover:text-amber-400 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-slate-300">
                    Click to upload event banner
                  </div>
                  <div className="text-[11px] text-slate-500">
                    PNG, JPG, WebP, GIF or AVIF up to 5 MB
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Venue Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Venue <span className="text-amber-400">*</span>
              </label>

              <select
                value={form.venueId}
                onChange={(e) => {
                  const newVenueId = e.target.value;
                  const v = venues.find((item) => item._id === newVenueId);
                  setForm((prev) => ({
                    ...prev,
                    venueId: newVenueId,
                    maxParticipants: v?.capacity ? Math.min(prev.maxParticipants, v.capacity) : prev.maxParticipants,
                  }));
                }}
                required
                disabled={venuesLoading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="" className="bg-slate-900 text-slate-400">
                  {venuesLoading ? "Loading venues..." : "Select an approved venue"}
                </option>
                {venues.map((v) => (
                  <option key={v._id} value={v._id} className="bg-slate-900 text-white">
                    {v.venueName} {v.location?.city ? `(${v.location.city})` : ""} — {v.capacity} seats · ${v.pricePerDay}/day
                  </option>
                ))}
              </select>

              {/* Selected Venue Details Card */}
              {selectedVenue && (
                <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-md transition-all duration-300 shadow-lg">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Venue Photo Thumbnail */}
                    <div className="relative aspect-video sm:aspect-square w-full sm:w-28 shrink-0 overflow-hidden rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center">
                      {selectedVenue.images?.[0]?.url ? (
                        <img
                          src={selectedVenue.images[0].url}
                          alt={selectedVenue.venueName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500 gap-1 p-2 text-center">
                          <Building2 className="h-6 w-6 text-slate-400" />
                          <span className="text-[10px]">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Venue Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white truncate">
                            {selectedVenue.venueName}
                          </h4>
                          {selectedVenue.location?.formattedAddress && (
                            <p className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                              <span className="truncate">{selectedVenue.location.formattedAddress}</span>
                            </p>
                          )}
                        </div>
                        {selectedVenue.status && (
                          <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                            {selectedVenue.status}
                          </span>
                        )}
                      </div>

                      {/* Feature Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/60 px-2.5 py-1 text-slate-300">
                          <Users className="h-3.5 w-3.5 text-amber-400" />
                          <span>Max Capacity: <strong className="text-white font-semibold">{selectedVenue.capacity?.toLocaleString() ?? "N/A"}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/60 px-2.5 py-1 text-slate-300">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Price: <strong className="text-white font-semibold">${selectedVenue.pricePerDay?.toLocaleString() ?? 0}</strong>/day</span>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/60 px-2.5 py-1 text-slate-300">
                          <CreditCard className="h-3.5 w-3.5 text-sky-400" />
                          <span>
                            {selectedVenue.bookingPaymentPolicy === "advanceAllowed"
                              ? `Advance (${selectedVenue.advancePercentage ?? 20}%)`
                              : selectedVenue.bookingPaymentPolicy === "payAfterEvent"
                              ? "Pay After Event"
                              : "Full Payment"}
                          </span>
                        </div>
                      </div>

                      {/* Description snippet */}
                      {selectedVenue.description && (
                        <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                          {selectedVenue.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Calendar */}
            {form.venueId && (
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      Select Event Date
                    </span>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Select a start date, then an end date for multi-day events (one date = single day).
                    </p>
                  </div>
                  {availabilityLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={previousMonth}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    ←
                  </button>
                  <h3 className="text-sm font-bold text-white">{monthLabel}</h3>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-[10px] font-semibold text-slate-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dateKey = formatDateKey(date);
                    const booked = isDateBooked(date);
                    const past = isDateInPast(date);
                    const rangeActive = form.eventDate && form.eventEndDate;
                    const inRange = rangeActive && dateKey >= form.eventDate && dateKey <= form.eventEndDate;
                    const isEndpoint = form.eventDate === dateKey || (form.eventEndDate && form.eventEndDate === dateKey);
                    const selected = form.eventDate === dateKey;
                    const disabled = booked || past || availabilityLoading;

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectEventDate(date)}
                        className={[
                          "relative aspect-square rounded-lg text-xs font-semibold transition border",
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
                          disabled && !selected ? "cursor-not-allowed" : "",
                        ].join(" ")}
                      >
                        {date.getDate()}
                        {booked && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-red-400" />}
                      </button>
                    );
                  })}
                </div>

                {form.eventDate && (
                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                      Selected Event Date{form.eventEndDate ? " Range" : ""}
                    </p>
                    <p className="mt-1 text-sm font-bold text-amber-400">
                      {form.eventEndDate
                        ? `${new Date(`${form.eventDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${new Date(`${form.eventEndDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`
                        : new Date(`${form.eventDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
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

            {/* Pricing Model & Registration Format */}
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
                  {selectedVenue && (
                    <span className="text-slate-400 font-normal ml-2">
                      (Venue limit: {selectedVenue.capacity} seats)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedVenue?.capacity}
                  value={form.maxParticipants}
                  onChange={(e) => update("maxParticipants", Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Registration Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Certificate Toggle */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || availabilityLoading || !form.venueId || !form.eventDate}
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
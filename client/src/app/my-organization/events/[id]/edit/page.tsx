"use client";

import { useEffect, useState, useRef, useMemo, type FormEvent, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Users, MapPin, AlertCircle, X, DollarSign, CreditCard } from "lucide-react";
import { eventService, type UpdateEventPayload, type VenueAvailability } from "@/lib/eventApi";
import { api } from "@/lib/api";
import type { Venue } from "@/types";

function toDateTimeLocalValue(value: string | Date | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toDateOnlyValue(value: string | Date | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Original event state for comparison
  const [originalEvent, setOriginalEvent] = useState<any>(null);

  const [venueBookingId, setVenueBookingId] = useState<string | null>(null);
  const [bookedVenue, setBookedVenue] = useState<Venue | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Banner handling
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [removeBanner, setRemoveBanner] = useState(false);

  // Availability calendar state
  const [bookedDates, setBookedDates] = useState<VenueAvailability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [form, setForm] = useState<UpdateEventPayload & { eventTime?: string }>({
    eventName: "",
    description: "",
    eventType: "free",
    registrationType: "individual",
    maxParticipants: 50,
    registrationStartDate: "",
    registrationEndDate: "",
    eventDate: "",
    eventEndDate: "",
    eventTime: "",
    certificateEnabled: false,
    ticketPrice: 0,
    teamSize: undefined,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    eventService
      .getById(id)
      .then((res) => {
        if (cancelled) return;
        const event = res.data;
        setOriginalEvent(event);

        const eventStartDateKey = toDateOnlyValue(event.eventDate);
        const eventEndDateKey = event.eventEndDate ? toDateOnlyValue(event.eventEndDate) : "";

        setForm({
          eventName: event.eventName ?? "",
          description: event.description ?? "",
          eventType: event.eventType ?? "free",
          registrationType: event.registrationType ?? "individual",
          maxParticipants: event.maxParticipants ?? 50,
          registrationStartDate: toDateTimeLocalValue(event.registrationStartDate),
          registrationEndDate: toDateTimeLocalValue(event.registrationEndDate),
          eventDate: eventStartDateKey,
          eventEndDate: eventEndDateKey,
          eventTime: event.eventTime ?? "",
          certificateEnabled: event.certificateEnabled ?? false,
          ticketPrice: event.ticketPrice ?? 0,
          teamSize: event.teamSize,
        });

        if (eventStartDateKey) {
          const evDate = new Date(event.eventDate);
          setCalendarMonth(new Date(evDate.getFullYear(), evDate.getMonth(), 1));
        }

        // Set existing banner preview if available
        const existingUrl =
          event.bannerImage?.url ||
          (typeof event.bannerImage === "string" ? event.bannerImage : undefined) ||
          event.imageUrl;
        if (existingUrl) {
          setBannerPreview(existingUrl);
        }

        // Store booked venue details
        const venueBooking = (event as any).venueBookingId;
        if (venueBooking) {
          setVenueBookingId(typeof venueBooking === "string" ? venueBooking : venueBooking._id);
          if (venueBooking.venueId) {
            setBookedVenue(venueBooking.venueId);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.response?.data?.message ?? "Failed to load event");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // If venue booking is cancelled or missing, load available venues
  useEffect(() => {
    if (!venueBookingId) {
      api
        .listVenues()
        .then((res: any) => setVenues(res.data ?? []))
        .catch(() => setVenues([]));
    }
  }, [venueBookingId]);

  // Fetch venue availability whenever bookedVenue is loaded
  useEffect(() => {
    const venueId = bookedVenue?._id;
    if (!venueId) {
      setBookedDates([]);
      return;
    }

    let cancelled = false;
    setAvailabilityLoading(true);
    eventService
      .getVenueAvailability(venueId)
      .then((res: any) => {
        if (cancelled) return;
        setBookedDates(res?.data ?? res ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setBookedDates([]);
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookedVenue?._id]);

  // Banner handling
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Banner image cannot exceed 5 MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"].includes(file.type)) {
      setSaveError("Only JPEG, PNG, GIF, WebP and AVIF formats are allowed.");
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setRemoveBanner(false);
    setSaveError(null);
  };

  const handleRemoveImage = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setRemoveBanner(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));
  };

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // Calendar helpers
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

    // Event's own existing booking dates are not considered blocked
    const origStartKey = originalEvent ? toDateOnlyValue(originalEvent.eventDate) : "";
    const origEndKey = originalEvent?.eventEndDate
      ? toDateOnlyValue(originalEvent.eventEndDate)
      : origStartKey;

    if (origStartKey && selectedKey >= origStartKey && selectedKey <= origEndKey) {
      return false;
    }

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
        setSaveError("The selected range includes an unavailable date. Please choose a different end date.");
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

    setSaveError(null);
  }

  const origStartKey = originalEvent ? toDateOnlyValue(originalEvent.eventDate) : "";
  const origEndKey = originalEvent?.eventEndDate
    ? toDateOnlyValue(originalEvent.eventEndDate)
    : origStartKey;

  const datesHaveChanged = Boolean(
    origStartKey &&
      (form.eventDate !== origStartKey || (form.eventEndDate || "") !== (originalEvent?.eventEndDate ? origEndKey : ""))
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaveError(null);

    // Client-side validations
    if (!form.eventName?.trim() || form.eventName.trim().length < 3) {
      setSaveError("Event name must be at least 3 characters.");
      return;
    }

    if (!form.description?.trim() || form.description.trim().length < 3) {
      setSaveError("Description must be at least 3 characters.");
      return;
    }

    if (!form.eventDate) {
      setSaveError("Please select an event date.");
      return;
    }

    if (form.eventType === "paid" && (!form.ticketPrice || Number(form.ticketPrice) <= 0)) {
      setSaveError("Please enter a valid ticket price greater than 0.");
      return;
    }

    if (form.registrationType === "team" && (!form.teamSize || Number(form.teamSize) < 2)) {
      setSaveError("Team size must be at least 2.");
      return;
    }

    if (!form.maxParticipants || Number(form.maxParticipants) < 1) {
      setSaveError("Max capacity must be at least 1.");
      return;
    }

    if (bookedVenue?.capacity && Number(form.maxParticipants) > bookedVenue.capacity) {
      setSaveError(`Max capacity cannot exceed venue capacity (${bookedVenue.capacity} seats).`);
      return;
    }

    if (!form.registrationStartDate || !form.registrationEndDate) {
      setSaveError("Please set the registration open and close dates.");
      return;
    }

    if (new Date(form.registrationEndDate) <= new Date(form.registrationStartDate)) {
      setSaveError("Registration close date must be after the open date.");
      return;
    }

    const eventEndBoundary = form.eventEndDate
      ? new Date(`${form.eventEndDate}T23:59:59`)
      : new Date(`${form.eventDate}T23:59:59`);
    if (new Date(form.registrationEndDate) > eventEndBoundary) {
      setSaveError("Registration close date must be on or before the event concludes.");
      return;
    }

    if (form.eventEndDate && form.eventEndDate < form.eventDate) {
      setSaveError("Event end date must be on or after the event start date.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("eventName", form.eventName.trim());
      formData.append("description", form.description.trim());
      if (form.eventType) formData.append("eventType", form.eventType);
      if (form.registrationType) formData.append("registrationType", form.registrationType);
      formData.append("maxParticipants", String(form.maxParticipants));

      if (form.eventType === "paid" && form.ticketPrice) {
        formData.append("ticketPrice", String(form.ticketPrice));
      }

      if (form.registrationType === "team" && form.teamSize) {
        formData.append("teamSize", String(form.teamSize));
      }

      formData.append("registrationStartDate", new Date(form.registrationStartDate).toISOString());
      formData.append("registrationEndDate", new Date(form.registrationEndDate).toISOString());
      const eventDateIso = form.eventTime
        ? new Date(`${form.eventDate}T${form.eventTime}:00`).toISOString()
        : new Date(`${form.eventDate}T00:00:00`).toISOString();
      formData.append("eventDate", eventDateIso);

      if (form.eventEndDate) {
        formData.append("eventEndDate", new Date(`${form.eventEndDate}T00:00:00`).toISOString());
      } else {
        formData.append("removeEventEndDate", "true");
      }

      if (form.eventTime) {
        formData.append("eventTime", form.eventTime);
      }

      formData.append("certificateEnabled", String(form.certificateEnabled ?? false));

      if (bannerFile) {
        formData.append("bannerImage", bannerFile);
      } else if (removeBanner) {
        formData.append("removeBannerImage", "true");
      }

      await eventService.update(id, formData);
      router.push("/my-organization/events");
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!venueBookingId) return;
    const confirmed = window.confirm("Are you sure you want to cancel the venue booking for this event?");
    if (!confirmed) return;

    setCancelling(true);
    setCancelMessage(null);
    try {
      await api.cancelVenueBooking(venueBookingId, cancelReason.trim() || undefined);
      setCancelMessage({
        type: "success",
        text: "Venue booking cancelled. The venue is now available to others.",
      });
      setVenueBookingId(null);
    } catch (err: any) {
      setCancelMessage({
        type: "error",
        text: err?.response?.data?.message ?? "Could not cancel the booking",
      });
    } finally {
      setCancelling(false);
    }
  };

  const isOverCapacity =
    bookedVenue?.capacity &&
    form.maxParticipants &&
    Number(form.maxParticipants) > bookedVenue.capacity;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#090d16] text-white font-sans antialiased p-5 sm:p-10 lg:p-12">
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-amber-400 font-black text-sm shadow-md border border-white/10">
                E
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Event<span className="text-amber-500">OS</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Edit <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">Event</span>
            </h1>
          </div>

          <Link
            href="/my-organization/events"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm"
          >
            &larr; Back
          </Link>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-[#111726]/40 animate-pulse" />
            ))}
          </div>
        )}

        {loadError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center backdrop-blur-xl">
            <p className="text-sm font-medium text-red-400">{loadError}</p>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {/* Booked Venue Summary Card */}
            {bookedVenue && (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-md transition-all duration-300 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Venue Photo Thumbnail */}
                  <div className="relative aspect-video sm:aspect-square w-full sm:w-28 shrink-0 overflow-hidden rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center">
                    {bookedVenue.images?.[0]?.url ? (
                      <img
                        src={bookedVenue.images[0].url}
                        alt={bookedVenue.venueName}
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            Booked Venue
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">
                          {bookedVenue.venueName}
                        </h4>
                        {bookedVenue.location?.formattedAddress && (
                          <p className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                            <span className="truncate">{bookedVenue.location.formattedAddress}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Feature Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/60 px-2.5 py-1 text-slate-300">
                        <Users className="h-3.5 w-3.5 text-amber-400" />
                        <span>Max Capacity: <strong className="text-white font-semibold">{bookedVenue.capacity?.toLocaleString() ?? "N/A"}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/60 px-2.5 py-1 text-slate-300">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Price: <strong className="text-white font-semibold">${bookedVenue.pricePerDay?.toLocaleString() ?? 0}</strong>/day</span>
                      </div>

                      {bookedVenue.bookingPaymentPolicy && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/60 px-2.5 py-1 text-slate-300">
                          <CreditCard className="h-3.5 w-3.5 text-sky-400" />
                          <span>
                            {bookedVenue.bookingPaymentPolicy === "advanceAllowed"
                              ? `Advance (${bookedVenue.advancePercentage ?? 20}%)`
                              : bookedVenue.bookingPaymentPolicy === "payAfterEvent"
                              ? "Pay After Event"
                              : "Full Payment"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5 rounded-2xl border border-white/10 bg-[#111726]/80 p-6 backdrop-blur-xl shadow-2xl"
            >
              {saveError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-600/90 p-3.5 text-xs font-medium text-white shadow-lg">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{saveError}</span>
                  <button
                    type="button"
                    onClick={() => setSaveError(null)}
                    className="shrink-0 text-white/80 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Banner Image Preview / Replace */}
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
                        Change Image
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
                    <div className="text-xs font-semibold text-slate-300">Click to upload banner image</div>
                    <div className="text-[11px] text-slate-500">PNG, JPG, WebP, GIF or AVIF up to 5 MB</div>
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

              {/* Event Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Event Name <span className="text-amber-400">*</span>
                </label>
                <input
                  name="eventName"
                  type="text"
                  value={form.eventName ?? ""}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description <span className="text-amber-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description ?? ""}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              {/* Venue Availability Calendar for Date Picking */}
              {bookedVenue && (
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">
                        Event Date & Venue Availability
                      </span>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Select start date, then end date for multi-day events. Green indicates available dates.
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
                      <div key={day} className="text-center text-[10px] font-semibold text-slate-500 py-1.5">
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
                      const inRange = Boolean(form.eventDate && form.eventEndDate && dateKey >= form.eventDate && dateKey <= form.eventEndDate);
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
                    <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                          Selected Event Date{form.eventEndDate ? " Range" : ""}
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-amber-400">
                          {form.eventEndDate
                            ? `${new Date(`${form.eventDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${new Date(`${form.eventEndDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`
                            : new Date(`${form.eventDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>

                      {form.eventEndDate && (
                        <button
                          type="button"
                          onClick={() => update("eventEndDate", "")}
                          className="rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition"
                        >
                          Make Single-Day Event
                        </button>
                      )}
                    </div>
                  )}

                  {datesHaveChanged && originalEvent?.status === "published" && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>
                        Notice: Changing the event date replaces the approved booking with a new request. Your event will return to <strong>draft</strong> status until the venue owner approves the new date.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Event Start Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Event Start Time <span className="text-slate-500">(Optional, e.g. 10:00 AM)</span>
                </label>
                <input
                  type="time"
                  name="eventTime"
                  value={form.eventTime ?? ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 scheme-dark"
                />
              </div>

              {/* Pricing Model & Registration Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pricing Model</label>
                  <select
                    name="eventType"
                    value={form.eventType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="free" className="bg-slate-900 text-white">Free Event</option>
                    <option value="paid" className="bg-slate-900 text-white">Paid Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registration Format</label>
                  <select
                    name="registrationType"
                    value={form.registrationType}
                    onChange={handleChange}
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
                      name="ticketPrice"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={form.ticketPrice ?? ""}
                      onChange={handleChange}
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
                      name="teamSize"
                      min="2"
                      placeholder="e.g. 4"
                      value={form.teamSize ?? ""}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                )}

                <div className={form.eventType === "free" && form.registrationType === "individual" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Max Capacity <span className="text-amber-400">*</span>
                    {bookedVenue && (
                      <span className="text-slate-400 font-normal ml-2">
                        (Venue limit: {bookedVenue.capacity} seats)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    min="1"
                    max={bookedVenue?.capacity}
                    value={form.maxParticipants ?? ""}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-xl border bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition ${
                      isOverCapacity
                        ? "border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
                        : "border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    }`}
                  />
                  {isOverCapacity && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Event capacity ({form.maxParticipants}) cannot exceed venue maximum capacity ({bookedVenue.capacity}).
                    </p>
                  )}
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
                    name="registrationStartDate"
                    value={form.registrationStartDate ?? ""}
                    onChange={handleChange}
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
                    name="registrationEndDate"
                    value={form.registrationEndDate ?? ""}
                    onChange={handleChange}
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
                    id="certificateEnabled"
                    name="certificateEnabled"
                    checked={form.certificateEnabled ?? false}
                    onChange={handleChange}
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
                disabled={saving || Boolean(isOverCapacity)}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </form>

            {venueBookingId && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-red-400">Cancel Venue Booking</h3>
                <p className="text-xs text-slate-400">
                  Free up the venue for others. The event will remain as a draft.
                </p>

                {cancelMessage && (
                  <p className={`text-xs ${cancelMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {cancelMessage.text}
                  </p>
                )}

                <input
                  type="text"
                  placeholder="Optional cancellation reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs text-white outline-none focus:border-red-500/50"
                />

                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Venue Booking"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

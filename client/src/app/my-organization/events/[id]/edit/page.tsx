"use client";

import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Users, MapPin, AlertCircle } from "lucide-react";
import { eventService, type UpdateEventPayload } from "@/lib/eventApi";
import { api } from "@/lib/api";

function toDateInputValue(value: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [venueBookingId, setVenueBookingId] = useState<string | null>(null);
  const [bookedVenue, setBookedVenue] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [form, setForm] = useState<UpdateEventPayload>({
    eventName: "",
    description: "",
    eventType: "free",
    registrationType: "individual",
    maxParticipants: 0,
    registrationStartDate: "",
    registrationEndDate: "",
    eventDate: "",
    eventEndDate: "",
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
        setForm({
          eventName: event.eventName ?? "",
          description: event.description ?? "",
          eventType: event.eventType ?? "free",
          registrationType: event.registrationType ?? "individual",
          maxParticipants: event.maxParticipants ?? 0,
          registrationStartDate: toDateInputValue(event.registrationStartDate),
          registrationEndDate: toDateInputValue(event.registrationEndDate),
          eventDate: toDateInputValue(event.eventDate),
          eventEndDate: toDateInputValue(event.eventEndDate),
          certificateEnabled: event.certificateEnabled ?? false,
          ticketPrice: event.ticketPrice ?? 0,
          teamSize: event.teamSize,
        });

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
    setSaveError(null);
  };

  const handleRemoveImage = () => {
    setBannerFile(null);
    setBannerPreview(null);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      if (form.eventName) formData.append("eventName", form.eventName);
      if (form.description) formData.append("description", form.description);
      if (form.eventType) formData.append("eventType", form.eventType);
      if (form.registrationType) formData.append("registrationType", form.registrationType);
      if (form.maxParticipants) formData.append("maxParticipants", String(form.maxParticipants));

      if (form.eventType === "paid" && form.ticketPrice) {
        formData.append("ticketPrice", String(form.ticketPrice));
      }

      if (form.registrationType === "team" && form.teamSize) {
        formData.append("teamSize", String(form.teamSize));
      }

      if (form.registrationStartDate) {
        formData.append("registrationStartDate", new Date(form.registrationStartDate).toISOString());
      }
      if (form.registrationEndDate) {
        formData.append("registrationEndDate", new Date(form.registrationEndDate).toISOString());
      }
      if (form.eventDate) {
        formData.append("eventDate", new Date(`${form.eventDate}T00:00:00`).toISOString());
      }
      if (form.eventEndDate) {
        formData.append("eventEndDate", new Date(`${form.eventEndDate}T00:00:00`).toISOString());
      }

      formData.append("certificateEnabled", String(form.certificateEnabled));

      if (bannerFile) {
        formData.append("bannerImage", bannerFile);
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
              <div className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-[#111726]/80 p-4 backdrop-blur-xl">
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800">
                  {bookedVenue.images?.[0]?.url ? (
                    <img
                      src={bookedVenue.images[0].url}
                      alt={bookedVenue.venueName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      <Building2 className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Booked Venue
                    </span>
                    <span className="text-[10px] text-slate-500">&bull;</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Users className="h-3 w-3 text-amber-400" /> Max {bookedVenue.capacity} guests
                    </span>
                  </div>

                  <h3 className="truncate text-sm font-bold text-white">
                    {bookedVenue.venueName}
                  </h3>

                  <p className="truncate text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                    {bookedVenue.location?.formattedAddress ||
                      [bookedVenue.location?.city, bookedVenue.location?.state].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border border-white/10 bg-[#111726]/80 p-6 backdrop-blur-xl"
            >
              {saveError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center">
                  <p className="text-sm font-medium text-red-400">{saveError}</p>
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
                    <div className="text-xs font-semibold text-slate-300">Click to upload new banner</div>
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Event Name</label>
                <input
                  name="eventName"
                  value={form.eventName ?? ""}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={form.description ?? ""}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Event Type</label>
                  <select
                    name="eventType"
                    value={form.eventType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registration Type</label>
                  <select
                    name="registrationType"
                    value={form.registrationType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                  >
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                  </select>
                </div>
              </div>

              {form.eventType === "paid" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ticket Price ($)</label>
                  <input
                    type="number"
                    name="ticketPrice"
                    min="0"
                    value={form.ticketPrice ?? ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              {form.registrationType === "team" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Team Size</label>
                  <input
                    type="number"
                    name="teamSize"
                    min="2"
                    value={form.teamSize ?? ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Participants
                  {bookedVenue?.capacity && (
                    <span className="text-slate-500 ml-1.5">(Venue limit: {bookedVenue.capacity})</span>
                  )}
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  min="1"
                  value={form.maxParticipants ?? ""}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-xl border bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none ${
                    isOverCapacity ? "border-amber-500 focus:border-amber-400" : "border-white/10 focus:border-amber-500/50"
                  }`}
                />
                {isOverCapacity && (
                  <p className="mt-1.5 text-xs text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Warning: Event capacity ({form.maxParticipants}) exceeds venue maximum capacity ({bookedVenue.capacity}).
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registration Start</label>
                  <input
                    type="date"
                    name="registrationStartDate"
                    value={form.registrationStartDate ?? ""}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registration End</label>
                  <input
                    type="date"
                    name="registrationEndDate"
                    value={form.registrationEndDate ?? ""}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Event Start Date</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={form.eventDate ?? ""}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Event End Date (Optional)</label>
                  <input
                    type="date"
                    name="eventEndDate"
                    value={form.eventEndDate ?? ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="certificateEnabled"
                  name="certificateEnabled"
                  checked={form.certificateEnabled ?? false}
                  onChange={handleChange}
                  className="h-4 w-4 rounded accent-amber-500"
                />
                <label htmlFor="certificateEnabled" className="text-xs text-slate-300">
                  Enable automated certificate issuance
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
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
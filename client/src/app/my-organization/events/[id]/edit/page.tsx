"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { eventService, type UpdateEventPayload } from "@/lib/eventApi";

function toDateInputValue(value: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

    // Ticket price and team size only make sense for paid / team events.
    // Sending a stale/zero value for the other type trips backend validation.
    const payload = { ...form };
    if (payload.eventType !== "paid") {
      delete payload.ticketPrice;
    }
    if (payload.registrationType !== "team") {
      delete payload.teamSize;
    }
    if (!payload.eventEndDate) {
      delete payload.eventEndDate;
    }

    try {
      await eventService.update(id, payload);
      router.push("/my-organization");
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? "Failed to update event");
      setSaving(false);
    }
  };

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
            href="/my-organization"
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
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-white/10 bg-[#111726]/80 p-6 backdrop-blur-xl"
          >
            {saveError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center">
                <p className="text-sm font-medium text-red-400">{saveError}</p>
              </div>
            )}

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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ticket Price</label>
                <input
                  type="number"
                  name="ticketPrice"
                  value={form.ticketPrice ?? 0}
                  onChange={handleChange}
                  min={0}
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
                  value={form.teamSize ?? ""}
                  onChange={handleChange}
                  min={1}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Participants</label>
              <input
                type="number"
                name="maxParticipants"
                value={form.maxParticipants ?? 0}
                onChange={handleChange}
                min={1}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registration Starts</label>
                <input
                  type="date"
                  name="registrationStartDate"
                  value={form.registrationStartDate ?? ""}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registration Ends</label>
                <input
                  type="date"
                  name="registrationEndDate"
                  value={form.registrationEndDate ?? ""}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Event Date</label>
                <input
                  type="date"
                  name="eventDate"
                  value={form.eventDate ?? ""}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Event End Date <span className="text-slate-500">(optional)</span></label>
                <input
                  type="date"
                  name="eventEndDate"
                  value={form.eventEndDate ?? ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-slate-300">
              <input
                type="checkbox"
                name="certificateEnabled"
                checked={form.certificateEnabled ?? false}
                onChange={handleChange}
                className="h-4 w-4 rounded border-white/10 bg-slate-900/60 accent-amber-500"
              />
              Enable certificates for participants
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href="/events/my-events"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
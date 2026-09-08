"use client";

/**
 * Venue owner bookings dashboard.
 *
 * Aggregates venue booking requests across every venue the current user
 * owns, and lets them approve or reject pending requests.
 *
 * Data flow:
 *   GET  /api/venues/my                    -> venues owned by the current user
 *   GET  /api/event-bookings/venue/:id     -> bookings for one of those venues
 *   PATCH /api/event-bookings/:id/approve  -> approve a pending booking
 *   PATCH /api/event-bookings/:id/reject   -> reject a pending booking
 */

import { useCallback, useEffect, useMemo, useState } from "react";

const API_ROOT = process.env.NEXT_PUBLIC_API_URL ?? "";
const VENUE_BASE = `${API_ROOT}/api/venues`;
const BOOKING_BASE = `${API_ROOT}/api/event-bookings`;

type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

interface RequestedBy {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface RawBooking {
  _id: string;
  venueId: string;
  organizationId: string;
  requestedBy: RequestedBy;
  startDate: string;
  endDate: string;
  bookingAmount: number;
  status: BookingStatus;
  paymentStatus: "pending" | "advancePaid" | "fullyPaid";
  createdAt: string;
}

interface OwnedVenue {
  _id: string;
  venueName: string;
}

// Booking merged with the venue name it belongs to, for display.
interface VenueBookingRow extends RawBooking {
  venueName: string;
}

type Filter = "all" | BookingStatus;

const STATUS_STYLES: Record<BookingStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Pending", dot: "bg-amber-500", text: "text-amber-800" },
  approved: { label: "Approved", dot: "bg-emerald-600", text: "text-emerald-800" },
  rejected: { label: "Rejected", dot: "bg-rose-600", text: "text-rose-800" },
  cancelled: { label: "Cancelled", dot: "bg-stone-400", text: "text-stone-600" },
  completed: { label: "Completed", dot: "bg-slate-500", text: "text-slate-700" },
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  return body?.data as T;
}

async function fetchOwnedVenues(): Promise<OwnedVenue[]> {
  return apiFetch<OwnedVenue[]>(`${VENUE_BASE}/my`);
}

async function fetchBookingsForVenue(venueId: string): Promise<RawBooking[]> {
  return apiFetch<RawBooking[]>(`${BOOKING_BASE}/venue/${venueId}`);
}

function formatDateRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  const dayMonth = (d: Date) =>
    d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const full = (d: Date) =>
    d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  if (start.toDateString() === end.toDateString()) return full(start);
  if (sameMonth) return `${start.getDate()}\u2013${dayMonth(end)}`;
  return `${dayMonth(start)} \u2013 ${full(end)}`;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function VenueOwnerBookingsPage() {
  const [rows, setRows] = useState<VenueBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [pendingAction, setPendingAction] = useState<Record<string, "approve" | "reject">>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [confirmReject, setConfirmReject] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const venues = await fetchOwnedVenues();

      if (venues.length === 0) {
        setRows([]);
        return;
      }

      const perVenue = await Promise.all(
        venues.map(async (venue) => {
          const bookings = await fetchBookingsForVenue(venue._id);
          return bookings.map((b) => ({ ...b, venueName: venue.venueName }));
        })
      );

      const merged = perVenue.flat().sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      setRows(merged);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: rows.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      completed: 0,
    };
    for (const r of rows) c[r.status] += 1;
    return c;
  }, [rows]);

  const visibleRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  async function handleApprove(bookingId: string) {
    setRowError((e) => ({ ...e, [bookingId]: "" }));
    setPendingAction((p) => ({ ...p, [bookingId]: "approve" }));
    try {
      await apiFetch(`${BOOKING_BASE}/${bookingId}/approve`, { method: "PATCH" });
      setRows((prev) =>
        prev.map((r) => (r._id === bookingId ? { ...r, status: "approved" } : r))
      );
    } catch (err) {
      setRowError((e) => ({
        ...e,
        [bookingId]: err instanceof Error ? err.message : "Approval failed",
      }));
    } finally {
      setPendingAction((p) => {
        const next = { ...p };
        delete next[bookingId];
        return next;
      });
    }
  }

  async function handleReject(bookingId: string) {
    setConfirmReject(null);
    setRowError((e) => ({ ...e, [bookingId]: "" }));
    setPendingAction((p) => ({ ...p, [bookingId]: "reject" }));
    try {
      await apiFetch(`${BOOKING_BASE}/${bookingId}/reject`, { method: "PATCH" });
      setRows((prev) =>
        prev.map((r) => (r._id === bookingId ? { ...r, status: "rejected" } : r))
      );
    } catch (err) {
      setRowError((e) => ({
        ...e,
        [bookingId]: err instanceof Error ? err.message : "Rejection failed",
      }));
    } finally {
      setPendingAction((p) => {
        const next = { ...p };
        delete next[bookingId];
        return next;
      });
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-8">
          <h1 className="font-serif text-3xl text-stone-900">Venue bookings</h1>
          <p className="mt-1 text-sm text-stone-500">
            Requests to book any of your venues land here.
          </p>
        </header>

        <nav className="mb-6 flex gap-1 border-b border-stone-200">
          {filters.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`relative px-3 py-2 text-sm transition-colors ${
                  active ? "text-stone-900" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {label}
                {counts[key] > 0 && (
                  <span className="ml-1.5 text-xs text-stone-400">{counts[key]}</span>
                )}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-stone-900" />
                )}
              </button>
            );
          })}
        </nav>

        {loading && (
          <div className="py-16 text-center text-sm text-stone-400">Loading bookings…</div>
        )}

        {!loading && loadError && (
          <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {loadError}.{" "}
            <button onClick={loadAll} className="underline underline-offset-2">
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && visibleRows.length === 0 && (
          <div className="rounded border border-dashed border-stone-300 py-16 text-center text-sm text-stone-500">
            {filter === "pending"
              ? "No pending requests right now."
              : `No ${filter === "all" ? "" : filter} bookings.`}
          </div>
        )}

        {!loading && !loadError && visibleRows.length > 0 && (
          <div className="overflow-hidden rounded border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
                  <th className="px-4 py-2.5 font-medium">Venue</th>
                  <th className="px-4 py-2.5 font-medium">Requested by</th>
                  <th className="px-4 py-2.5 font-medium">Dates</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const status = STATUS_STYLES[row.status];
                  const isActing = Boolean(pendingAction[row._id]);
                  const error = rowError[row._id];

                  return (
                    <tr key={row._id} className="border-b border-stone-100 last:border-0">
                      <td className="px-4 py-3 align-top text-stone-800">{row.venueName}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-stone-800">
                          {row.requestedBy.firstName} {row.requestedBy.lastName}
                        </div>
                        <div className="text-xs text-stone-400">{row.requestedBy.email}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-stone-600">
                        {formatDateRange(row.startDate, row.endDate)}
                      </td>
                      <td className="px-4 py-3 align-top text-stone-800">
                        {formatAmount(row.bookingAmount)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex items-center gap-1.5 ${status.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {row.status === "pending" ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(row._id)}
                                disabled={isActing}
                                className="rounded bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:bg-stone-700 disabled:opacity-50"
                              >
                                {pendingAction[row._id] === "approve" ? "Accepting…" : "Accept"}
                              </button>

                              {confirmReject === row._id ? (
                                <button
                                  onClick={() => handleReject(row._id)}
                                  disabled={isActing}
                                  className="rounded border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50"
                                >
                                  {pendingAction[row._id] === "reject" ? "Rejecting…" : "Confirm reject"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmReject(row._id)}
                                  disabled={isActing}
                                  className="rounded border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-300 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                            {error && <div className="text-xs text-rose-600">{error}</div>}
                          </div>
                        ) : (
                          <span className="text-xs text-stone-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layout } from "@/components/Layout";

import { eventService } from "@/lib/eventApi";
import { useAuth } from "@/context/AuthContext";

type SortOption =
  | "upcoming"
  | "latest"
  | "price-low"
  | "price-high";

type EventType="all" | "free" | "paid";



export default function EventsListPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
 const [eventType, setEventType] = useState<EventType>("all");

  const [sortBy, setSortBy] = useState<SortOption>("upcoming");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
  currentPage: 1,
  pageLimit: 8,
  totalEvents: 0,
  totalPages: 1,
});

  const { user } = useAuth();
  const hasOrganization = Boolean(user?.organizationId);

  const EVENTS_PER_PAGE = 8;

  useEffect(() => {
    let cancelled = false;

    eventService
      .publicList({
        search: search.trim() || undefined,
        location: location.trim() || undefined,
        eventType: eventType !== "all" ? eventType : undefined,
       sort: sortBy,
       page: currentPage,
       limit: EVENTS_PER_PAGE,})
      .then((res) => {
        if (!cancelled) {
          setEvents(res.data.events);
          setPagination(res.data.pagination);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ?? "Failed to load events"
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [search, location, eventType, sortBy, currentPage]);

  

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setEventType("all");
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  return (
    <Layout>
    <div className="relative min-h-screen w-full overflow-hidden bg-[#090d16] text-white font-sans antialiased px-4 py-8 sm:px-8 lg:px-10">

      {/* Background glow */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* =========================================
            DISCOVER SECTION
        ========================================= */}

        <section className="rounded-2xl border border-white/10 bg-[#0d1320]/80 px-4 py-8 shadow-2xl backdrop-blur-xl sm:px-8 sm:py-10">

          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-sm font-black text-amber-400 border border-white/10">
                E
              </div>

              <span className="text-base font-bold tracking-tight">
                Event<span className="text-amber-500">OS</span>
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center">

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Discover Events{" "}
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                That Matter
              </span>
            </h1>

            <p className="mt-2 text-xs text-slate-400 sm:text-sm">
              Find events, workshops, conferences, hackathons,
              meetups, and more.
            </p>

          </div>

          {/* Search */}
          <div className="mx-auto mt-7 flex max-w-4xl flex-col gap-2 rounded-xl border border-white/10 bg-[#111827] p-2 sm:flex-row">

            {/* Search input */}
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-[#0b111d] px-3">

              <svg
                className="h-4 w-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search events by name, category, or keyword..."
                className="h-10 w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
              />

            </div>

            {/* Location */}
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-[#0b111d] px-3">

              <svg
                className="h-4 w-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z"
                />

                <circle
                  cx="12"
                  cy="11"
                  r="2"
                  strokeWidth={2}
                />
              </svg>

              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Any Location"
                className="h-10 w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
              />

            </div>

            <button
              onClick={handleSearch}
              className="h-10 rounded-lg bg-amber-500 px-6 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
            >
              Search
            </button>

          </div>

          {/* Filters */}
          <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-2">

            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value as EventType );
                setCurrentPage(1);
              }}
              className="h-8 rounded-lg border border-white/10 bg-[#111827] px-3 text-[11px] text-slate-300 outline-none"
            >
              <option value="all">Event Type</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>

      
            <button
              onClick={clearFilters}
              className="h-8 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 text-[11px] font-medium text-amber-400 transition hover:bg-amber-500/20"
            >
              × Clear Filters
            </button>

          </div>

        </section>

        {/* =========================================
            UPCOMING EVENTS HEADER
        ========================================= */}

        <section className="mt-8">

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Upcoming Events
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                {pagination.totalEvents} events found
              </p>
            </div>

            <div className="flex items-center gap-2">

              <span className="text-[11px] text-slate-500">
                Sort By:
              </span>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy( e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-[11px] text-slate-300 outline-none"
              >
                <option value="upcoming">Upcoming First</option>
                <option value="latest">Latest Added</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

            </div>

          </div>

          {/* =========================================
              LOADING
          ========================================= */}

          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-xl border border-white/10 bg-[#111726] animate-pulse"
                >
                  <div className="h-36 bg-slate-800" />

                  <div className="space-y-3 p-4">
                    <div className="h-3 w-1/3 rounded bg-slate-800" />
                    <div className="h-5 w-4/5 rounded bg-slate-800" />
                    <div className="h-3 w-full rounded bg-slate-800" />
                    <div className="h-3 w-3/4 rounded bg-slate-800" />
                  </div>
                </div>
              ))}

            </div>
          )}

          {/* =========================================
              ERROR
          ========================================= */}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* =========================================
              EMPTY
          ========================================= */}

          {!loading &&
            !error &&
            events.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-[#111726] p-12 text-center">

                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-xl">
                  ⚡
                </div>

                <h3 className="text-lg font-bold">
                  No events found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500">
                  Try changing your search or filters to find
                  more events.
                </p>

                <button
                  onClick={clearFilters}
                  className="mt-5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Clear Filters
                </button>

              </div>
            )}

          {/* =========================================
              EVENT GRID
          ========================================= */}

          {!loading &&
            !error &&
            events.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {events.map((event) => {
                  const isPaid = event.eventType === "paid";

                  const venueName =
                          event.venueBookingId?.venueId?.venueName;

                  const location =
                         event.venueBookingId?.venueId?.location?.formattedAddress;

                  const image =
                    event.imageUrl ||
                    event.image ||
                    event.bannerImage;

                  return (
                    <div
                      key={event._id}
                      className="group overflow-hidden rounded-xl border border-white/10 bg-[#111726] transition duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-xl hover:shadow-black/30"
                    >

                      {/* =================================
                          EVENT IMAGE
                      ================================= */}

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

                        {/* Image overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                        {/* Category */}
                        <div className="absolute left-2 top-2 flex gap-1.5">

                          {event.category && (
                            <span className="rounded-md bg-blue-500 px-2 py-1 text-[9px] font-bold uppercase text-white shadow">
                              {event.category}
                            </span>
                          )}

                          <span
                            className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase shadow ${
                              isPaid
                                ? "bg-amber-500 text-slate-950"
                                : "bg-emerald-500 text-slate-950"
                            }`}
                          >
                            {isPaid ? "Paid" : "Free"}
                          </span>

                        </div>

                      </div>

                      {/* =================================
                          CARD CONTENT
                      ================================= */}

                      <div className="flex min-h-[225px] flex-col p-4">

                        <div>

                          {/* Date */}
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

                            {new Date(
                              event.eventDate
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}

                          </div>

                          {/* Title */}
                          <h3 className="line-clamp-2 text-base font-bold leading-tight text-white transition group-hover:text-amber-400">
                            {event.eventName}
                          </h3>

                          {/* Description */}
                          {event.description && (
                            <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                              {event.description}
                            </p>
                          )}

                          {/* Location */}
                          {(venueName || location) && (
 <div className="mt-3 flex items-start gap-2 text-xs text-slate-300">
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z"
      />
      <circle
        cx="12"
        cy="11"
        r="2"
        strokeWidth={2}
      />
    </svg>

    <div className="min-w-0">
      {venueName && (
        <p className="truncate font-semibold text-slate-200">
          {venueName}
        </p>
      )}

      {location && (
        <p className="truncate text-xs text-slate-400">
          {location}
        </p>
      )}
    </div>
  </div>
)}
                        </div>

                        {/* Bottom */}
                        <div className="mt-auto pt-4">

                          <div className="mb-3 flex items-center justify-between border-t border-white/5 pt-3">

                            <div>
                              <p className="text-[9px] text-slate-600">
                                Price
                              </p>

                              <p
                                className={`text-sm font-bold ${
                                  isPaid
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {isPaid
                                  ? `₹${event.ticketPrice || 0}`
                                  : "Free"}
                              </p>
                            </div>

                            <div className="text-right">

                              <p className="text-[9px] text-slate-600">
                                Capacity
                              </p>

                              <p className="text-[10px] font-medium text-slate-300">
                                {event.maxParticipants || 0} seats
                              </p>

                            </div>

                          </div>

                          <Link
                            href={`/events/${event._id}`}
                            className="flex w-full items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-[10px] font-bold text-amber-400 transition hover:bg-amber-500 hover:text-slate-950"
                          >
                            View Details
                          </Link>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

        </section>

        {/* =========================================
            PAGINATION
        ========================================= */}

        {!loading &&
          !error &&
          events.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-[10px] text-slate-500">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * EVENTS_PER_PAGE + 1,
                  pagination.totalEvents
                )}
                -
                {Math.min(
                  currentPage * EVENTS_PER_PAGE,
                  pagination.totalEvents
                )}{" "}
                of {pagination.totalEvents} events
              </p>

              <div className="flex items-center gap-1">

                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => prev - 1)
                  }
                  className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-[10px] text-slate-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ← Previous
                </button>

                {Array.from(
                  { length: pagination.totalPages },
                  (_, index) => index + 1
                )
                  .slice(0, 5)
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`grid h-8 w-8 place-items-center rounded-lg text-[10px] font-semibold transition ${
                        currentPage === page
                          ? "bg-amber-500 text-slate-950"
                          : "border border-white/10 bg-[#111827] text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => prev + 1)
                  }
                  className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-[10px] text-slate-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next →
                </button>

              </div>

            </div>
          )}

      </div>
    </div>
    </Layout>
  );
}
"use client";

import { useEffect, useState } from "react";
import { eventService } from "@/lib/eventApi";
import { orgRoleApi } from "@/lib/orgRoleApi";
import { CheckCircle2, Clock, Search, Camera } from "lucide-react";
import type { ParticipantRecord } from "@/types";
import QRScannerModal from "@/components/scanner/QRScannerModal";

const isEventToday = (eventDate?: string, eventEndDate?: string) => {
  if (!eventDate) return false;
  const now = new Date();

  const start = new Date(eventDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(eventEndDate ?? eventDate);
  end.setHours(23, 59, 59, 999);

  return now >= start && now <= end;
};

export default function ParticipantsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchParticipants = (eventId: string) => {
    if (!eventId) return;
    setLoading(true);
    orgRoleApi
      .getParticipants(eventId)
      .then((res) => setParticipants(res.data.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    eventService.byOrganization().then((res) => {
      setEvents(res.data ?? []);
      if (res.data?.length) {
        setSelectedEventId(res.data[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    fetchParticipants(selectedEventId);
  }, [selectedEventId]);

  const handleToggleCheckIn = async (regId: string) => {
    await orgRoleApi.toggleCheckIn(selectedEventId, regId);
    setParticipants((prev) =>
      prev.map((p) => (p._id === regId ? { ...p, checkedIn: !p.checkedIn } : p))
    );
  };

  const handleAttendeeUpdated = () => {
    fetchParticipants(selectedEventId);
  };

  const selectedEvent = events.find((ev) => ev._id === selectedEventId);
  const isToday = isEventToday(selectedEvent?.eventDate, selectedEvent?.eventEndDate);

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const name = `${p.participantId?.firstName} ${p.participantId?.lastName}`.toLowerCase();
    const email = p.participantId?.email?.toLowerCase() ?? "";
    const team = p.teamId?.teamName?.toLowerCase() ?? "";
    return name.includes(q) || email.includes(q) || team.includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Participant & Attendee Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review registrations, team rosters, and scan ticket QR codes on event day.
          </p>
        </div>

        {/* Scan Button with Event Day Check */}
        {isToday ? (
          <button
            type="button"
            disabled={!selectedEventId}
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/20 animate-pulse disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            Scan Ticket QR (Live Today)
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-slate-400">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>
              Check-in opens on{" "}
              {selectedEvent?.eventDate
                ? new Date(selectedEvent.eventDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "event day"}
            </span>
          </div>
        )}
      </div>

      {/* Select Event and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Select Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-[#111726] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.eventName}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-slate-400 block mb-1">Search Attendees</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by attendee name, email, or team name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111726] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-[#111726] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-semibold text-white">
            Attendees ({filtered.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Loading participants...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No registered attendees found.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((p) => {
              const isTeam = Boolean(p.teamId);
              const attendedCount = (p as any).attendedCount ?? (p.checkedIn ? 1 : 0);
              const totalTeamMembers = (p as any).totalTeamMembers ?? 1;

              return (
                <div
                  key={p._id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white text-sm">
                        {p.participantId?.firstName} {p.participantId?.lastName}
                      </p>
                      {p.teamId && (
                        <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          Team: {p.teamId.teamName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.participantId?.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        p.checkedIn
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {p.checkedIn ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Checked In
                          {isTeam && (
                            <span className="ml-1 text-[9px] text-emerald-300">
                              ({attendedCount}/{totalTeamMembers})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" /> Not Checked In
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleCheckIn(p._id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        p.checkedIn
                          ? "border border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {p.checkedIn ? "Undo" : "Check In"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Camera QR Scanner Modal */}
      {selectedEventId && (
        <QRScannerModal
          isOpen={isScannerOpen}
          eventId={selectedEventId}
          onClose={() => setIsScannerOpen(false)}
          onAttendeeUpdated={handleAttendeeUpdated}
        />
      )}
    </div>
  );
}
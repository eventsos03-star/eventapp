"use client";

import { useEffect, useState } from "react";
import { eventService } from "@/lib/eventApi";
import { orgRoleApi } from "@/lib/orgRoleApi";
import { Users, CheckCircle2, Clock, Search, ShieldCheck } from "lucide-react";
import type { ParticipantRecord } from "@/types";

export default function ParticipantsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    eventService.byOrganization().then((res) => {
      setEvents(res.data ?? []);
      if (res.data?.length) setSelectedEventId(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    orgRoleApi
      .getParticipants(selectedEventId)
      .then((res) => setParticipants(res.data.data ?? []))
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  const handleToggleCheckIn = async (regId: string) => {
    await orgRoleApi.toggleCheckIn(selectedEventId, regId);
    setParticipants((prev) =>
      prev.map((p) => (p._id === regId ? { ...p, checkedIn: !p.checkedIn } : p))
    );
  };

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const name = `${p.participantId?.firstName} ${p.participantId?.lastName}`.toLowerCase();
    const email = p.participantId?.email?.toLowerCase() ?? "";
    const team = p.teamId?.teamName?.toLowerCase() ?? "";
    return name.includes(q) || email.includes(q) || team.includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Participant & Attendee Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review event registrations, teams, and manage attendee check-ins on event day.
        </p>
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
      <div className="bg-[#111726] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-semibold text-white">Attendees ({filtered.length})</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading participants...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No registered attendees found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((p) => (
              <div key={p._id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {p.participantId?.firstName} {p.participantId?.lastName}
                  </h4>
                  <p className="text-xs text-slate-400">{p.participantId?.email}</p>
                  {p.teamId && (
                    <span className="text-[11px] text-amber-400 mt-1 inline-block">
                      Team: {p.teamId.teamName} ({p.teamId.teamCode})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleCheckIn(p._id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      p.checkedIn
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {p.checkedIn ? "Checked In" : "Mark Arrival"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
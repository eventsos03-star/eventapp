"use client";

import { useEffect, useState } from "react";
import { eventService } from "@/lib/eventApi";
import { orgRoleApi } from "@/lib/orgRoleApi";
import { Award, Check, ExternalLink, Send } from "lucide-react";
import type { IssuedCertificate, ParticipantRecord } from "@/types";

export default function CertificatesPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [issuedCerts, setIssuedCerts] = useState<IssuedCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  useEffect(() => {
    eventService.byOrganization().then((res) => {
      setEvents(res.data ?? []);
      if (res.data?.length) setSelectedEventId(res.data[0]._id);
    });
  }, []);

  const loadEventData = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const [partRes, certRes] = await Promise.all([
        orgRoleApi.getParticipants(selectedEventId),
        orgRoleApi.getCertificates(selectedEventId),
      ]);
      setParticipants(partRes.data.data ?? []);
      setIssuedCerts(certRes.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [selectedEventId]);

  const handleIssue = async (registrationId: string) => {
    setIssuingId(registrationId);
    try {
      await orgRoleApi.issueCertificate(registrationId);
      await loadEventData();
    } finally {
      setIssuingId(null);
    }
  };

  const isIssued = (regId: string) => issuedCerts.some((c) => (c.registrationId as any)?._id === regId);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Certificate Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          Issue verified completion/winner certificates to participants.
        </p>
      </div>

      {/* Select Event */}
      <div className="max-w-xs">
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

      {/* Issuance Table */}
      <div className="bg-[#111726] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Eligible Attendees</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading data...</div>
        ) : participants.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No attendees found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {participants.map((p) => {
              const issued = isIssued(p._id);
              return (
                <div key={p._id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {p.participantId?.firstName} {p.participantId?.lastName}
                    </h4>
                    <p className="text-xs text-slate-400">{p.participantId?.email}</p>
                  </div>

                  <div>
                    {issued ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        Certificate Issued
                      </span>
                    ) : (
                      <button
                        onClick={() => handleIssue(p._id)}
                        disabled={issuingId === p._id}
                        className="bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs hover:bg-amber-400 transition flex items-center gap-1.5"
                      >
                        <Award className="h-4 w-4" />
                        {issuingId === p._id ? "Issuing..." : "Issue Certificate"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
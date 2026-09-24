"use client";

import { useEffect, useState } from "react";
import { organizationApi } from "@/lib/organizationApi";
import { UserPlus, Trash2, ShieldCheck, Mail } from "lucide-react";
import type { OrganizationMember, OrgMemberRole } from "@/types";

const ROLE_OPTIONS: { value: OrgMemberRole; label: string; desc: string }[] = [
  { value: "finance_manager", label: "Finance Manager", desc: "Manages ticket revenue, venue payments & reports" },
  { value: "user_manager", label: "User / Participant Manager", desc: "Manages registrations, attendee check-ins & teams" },
  { value: "certificate_manager", label: "Certificate Manager", desc: "Issues & manages certificates for attendees" },
  { value: "organizer", label: "General Organizer", desc: "Helps schedule and manage general event details" },
  { value: "member", label: "General Member", desc: "Standard organization team member" },
];

export default function MembersPage() {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgMemberRole>("finance_manager");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchMembers = async () => {
    try {
      const org = await organizationApi.getMy();
      if (org.data) {
        const res = await organizationApi.getMembers(org.data.id);
        setMembers(res.data ?? []);
      }
    } catch {
      setMsg({ type: "error", text: "Failed to load members" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      const org = await organizationApi.getMy();
      if (!org.data) return;
      await organizationApi.addMember(org.data.id, email.trim(), role as any);
      setMsg({ type: "success", text: `Invited ${email} as ${role.replace("_", " ")}` });
      setEmail("");
      fetchMembers();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message ?? "Failed to invite member" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const org = await organizationApi.getMy();
      if (!org.data) return;
      await organizationApi.removeMember(org.data.id, memberId);
      fetchMembers();
    } catch (err: any) {
      setMsg({ type: "error", text: "Failed to remove member" });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Roles & Task Delegation</h1>
        <p className="text-sm text-slate-400 mt-1">
          Assign dedicated managers for Finance, Participants, and Certificates.
        </p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm ${
            msg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Invite Box */}
      <form onSubmit={handleInvite} className="bg-[#111726] border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-amber-500" />
          Assign a Member to a Specific Role
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">User Email</label>
            <input
              type="email"
              required
              placeholder="colleague@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">Role Responsibility</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgMemberRole)}
              className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.desc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-amber-400 transition"
        >
          {submitting ? "Assigning..." : "Assign Role"}
        </button>
      </form>

      {/* Members Table */}
      <div className="bg-[#111726] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Current Organization Members</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No members added yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {members.map((m) => {
              const u: any = m.userId;
              return (
                <div key={m.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-800 grid place-items-center font-bold text-amber-400">
                      {u?.firstName?.[0] ?? "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {u?.firstName} {u?.lastName}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3" />
                        {u?.email ?? m.inviteEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {m.role.replace("_", " ")}
                    </span>

                    {m.role !== "owner" && (
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 transition"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
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
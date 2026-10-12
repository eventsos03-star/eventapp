"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Users,
  CheckSquare,
  Square,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { orgRoleApi } from "@/lib/orgRoleApi";

interface QRScannerModalProps {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
  onAttendeeUpdated: (registrationId: string) => void;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  isCheckedIn: boolean;
  checkedInAt?: string;
}

interface TeamInfo {
  _id: string;
  teamName: string;
  teamCode: string;
  totalMembers: number;
  checkedInCount: number;
  members: TeamMember[];
}

export default function QRScannerModal({
  isOpen,
  eventId,
  onClose,
  onAttendeeUpdated,
}: QRScannerModalProps) {
  const [scanResult, setScanResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Team ticket state
  const [teamData, setTeamData] = useState<{
    team: TeamInfo;
    registrationId: string;
    ticketNumber: string;
  } | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [submittingTeam, setSubmittingTeam] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isCooldownRef = useRef(false);

  // Clean stop for camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        // Ignore stop error
      }
    }
  };

  // Start Camera
  const startCamera = async () => {
    const qrElementId = "qr-reader-viewport";
    const element = document.getElementById(qrElementId);
    if (!element) return;

    try {
      const qrScanner = new Html5Qrcode(qrElementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (isCooldownRef.current) return;
          isCooldownRef.current = true;
          setIsProcessing(true);

          try {
            const res = await orgRoleApi.scanTicket(eventId, decodedText.trim());
            const data = res.data.data;

            if (data.isTeam) {
              // Pause camera and show Team Roster modal
              await stopCamera();
              setTeamData({
                team: data.team,
                registrationId: data.registrationId,
                ticketNumber: data.ticket?.ticketNumber ?? decodedText,
              });
              // Pre-select members who haven't checked in yet
              const unChecked = data.team.members
                .filter((m: TeamMember) => !m.isCheckedIn)
                .map((m: TeamMember) => m._id);
              setSelectedMemberIds(unChecked);
              setIsProcessing(false);
            } else {
              // Individual Ticket: instantaneous success!
              setScanResult({
                type: "success",
                message: data.message || "Attendee checked in successfully!",
              });
              onAttendeeUpdated(data.registration._id);

              setTimeout(() => {
                isCooldownRef.current = false;
                setScanResult(null);
                setIsProcessing(false);
              }, 2500);
            }
          } catch (err: any) {
            setScanResult({
              type: "error",
              message:
                err?.response?.data?.message || "Invalid or already used ticket.",
            });
            setTimeout(() => {
              isCooldownRef.current = false;
              setScanResult(null);
              setIsProcessing(false);
            }, 3000);
          }
        },
        () => {}
      );
    } catch (err) {
      setScanResult({
        type: "error",
        message: "Camera permission denied or camera not found.",
      });
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen && !teamData) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, teamData]);

  // Toggle selection for a team member
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Submit Team Check-In
  const handleConfirmTeamCheckIn = async () => {
    if (!teamData || selectedMemberIds.length === 0) return;
    setSubmittingTeam(true);

    try {
      const res = await orgRoleApi.checkInTeamMembers(
        eventId,
        teamData.registrationId,
        selectedMemberIds
      );

      setScanResult({
        type: "success",
        message: res.data.message || "Team check-in recorded successfully!",
      });

      onAttendeeUpdated(teamData.registrationId);

      // Return to scanner after 2 seconds
      setTimeout(() => {
        setTeamData(null);
        setSubmittingTeam(false);
        setScanResult(null);
        isCooldownRef.current = false;
      }, 2000);
    } catch (err: any) {
      setScanResult({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to record team attendance.",
      });
      setSubmittingTeam(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111726] shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            {teamData ? (
              <Users className="h-5 w-5 text-amber-400" />
            ) : (
              <Camera className="h-5 w-5 text-amber-400" />
            )}
            <h3 className="text-base font-bold text-white">
              {teamData ? "Team Check-In Roster" : "Scan Attendee Ticket QR"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* ===================================================
              VIEW 1: CAMERA SCANNER (For all tickets initially)
             =================================================== */}
          {!teamData && (
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/15 bg-slate-950 flex items-center justify-center">
                <div id="qr-reader-viewport" className="h-full w-full" />

                {/* Reticle Focus Area */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-56 w-56 rounded-2xl border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.25)] animate-pulse" />
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm gap-2">
                    <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                    <p className="text-xs font-semibold text-white">
                      Verifying ticket...
                    </p>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {scanResult && (
                <div
                  className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-semibold ${
                    scanResult.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {scanResult.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{scanResult.message}</span>
                </div>
              )}

              <p className="text-center text-[11px] text-slate-400">
                Position the ticket QR code in front of the camera. Both individual and team tickets are detected automatically.
              </p>
            </div>
          )}

          {/* ===================================================
              VIEW 2: TEAM ROSTER CHECK-IN MODAL
             =================================================== */}
          {teamData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-white text-sm">
                      {teamData.team.teamName}
                    </h4>
                    <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                      Code: {teamData.team.teamCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ticket #{teamData.ticketNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400">
                    {teamData.team.checkedInCount} / {teamData.team.totalMembers}
                  </span>
                  <p className="text-[10px] text-slate-500">Checked In</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Select arriving members:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const allUnchecked = teamData.team.members
                        .filter((m) => !m.isCheckedIn)
                        .map((m) => m._id);
                      setSelectedMemberIds(
                        selectedMemberIds.length === allUnchecked.length
                          ? []
                          : allUnchecked
                      );
                    }}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Toggle all un-checked
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {teamData.team.members.map((member) => (
                    <div
                      key={member._id}
                      onClick={() => {
                        if (!member.isCheckedIn) toggleMemberSelection(member._id);
                      }}
                      className={`flex items-center justify-between rounded-xl border p-3 transition ${
                        member.isCheckedIn
                          ? "border-white/5 bg-slate-900/40 opacity-70 cursor-not-allowed"
                          : selectedMemberIds.includes(member._id)
                          ? "border-amber-500/40 bg-amber-500/10 cursor-pointer"
                          : "border-white/10 bg-slate-900/60 hover:bg-slate-900 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {member.isCheckedIn ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : selectedMemberIds.includes(member._id) ? (
                          <CheckSquare className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-500" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-white">
                            {member.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      {member.isCheckedIn ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                          Checked In
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          {selectedMemberIds.includes(member._id)
                            ? "Mark Present"
                            : "Absent"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Message */}
              {scanResult && (
                <div
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold ${
                    scanResult.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {scanResult.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{scanResult.message}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTeamData(null);
                    isCooldownRef.current = false;
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                <button
                  type="button"
                  disabled={submittingTeam || selectedMemberIds.length === 0}
                  onClick={handleConfirmTeamCheckIn}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {submittingTeam ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Check In Present Members (${selectedMemberIds.length})`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
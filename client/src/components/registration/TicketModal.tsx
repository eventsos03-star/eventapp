"use client";

import { X, Ticket as TicketIcon, MapPin, CalendarDays } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";

interface TicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    registration: any;
    ticket: any;
}

export default function TicketModal({
    isOpen,
    onClose,
    registration,
    ticket,
}: TicketModalProps) {
    const {user}=useAuth()

    if (!isOpen || !registration || !ticket) {
        return null;
    }

    const event = registration.eventId;
    const team = registration.teamId;

    const participantName = `${user?.firstName ?? ""} ${
    user?.lastName ?? ""
}`.trim() || "Participant";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
               className="relative w-full max-w-md max-h-[92vh] overflow-y-auto hide-scrollbar rounded-2xl bg-[#12151D] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="border-b border-white/10 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                            <TicketIcon
                                size={21}
                                className="text-amber-400"
                            />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Event Ticket
                            </h2>

                            <p className="text-xs text-gray-400">
                                Show this QR code at the event entrance
                            </p>
                        </div>
                    </div>
                </div>

                {/* QR section */}
                <div className="flex flex-col items-center px-6 pt-6">

                      <div className="rounded-2xl bg-white p-3 shadow-lg">
                        <QRCodeSVG
                            value={ticket.ticketNumber}
                            size={220}
                            level="H"
                        />
                    </div>

                    <p className="mt-4 text-xs text-gray-500">
                        Ticket Number
                    </p>

                    <p className="mt-1 text-sm font-medium text-white">
                        {ticket.ticketNumber}
                    </p>
                </div>

                {/* Event information */}
                <div className="space-y-4 px-6 py-4">

                    {/* Event name */}
                    <div>
                        <p className="text-xs text-gray-500">
                            Event
                        </p>

                        <p className="mt-1 text-base font-semibold text-white">
                            {event?.eventName ?? "Event"}
                        </p>
                    </div>

                    {/* Date */}
                    {event?.eventDate && (
                        <div className="flex items-center gap-3">
                            <CalendarDays
                                size={18}
                                className="text-gray-400"
                            />

                            <div>
                                <p className="text-xs text-gray-500">
                                    Event Date
                                </p>

                                <p className="text-sm text-gray-200">
                                    {new Date(
                                        event.eventDate
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Venue */}
                    {event?.venue && (
                        <div className="flex items-center gap-3">
                            <MapPin
                                size={18}
                                className="text-gray-400"
                            />

                            <div>
                                <p className="text-xs text-gray-500">
                                    Venue
                                </p>

                                <p className="text-sm text-gray-200">
                                    {typeof event.venue === "string"
                                        ? event.venue
                                        : event.venue?.name}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Participant / Team */}
                    {team ? (
                        <div>
                            <p className="text-xs text-gray-500">
                                Team
                            </p>

                            <p className="mt-1 text-sm font-medium text-white">
                                {team.teamName}
                            </p>

                            {event?.teamSize && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Team size: {event.teamSize}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-gray-500">
                                Participant
                            </p>

                            <p className="mt-1 text-sm font-medium text-white">
                                {participantName}
                            </p>
                        </div>
                    )}

                    {/* Registration ID */}
                    <div>
                        <p className="text-xs text-gray-500">
                            Registration ID
                        </p>

                        <p className="mt-1 break-all text-xs text-gray-300">
                            {registration._id}
                        </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <span className="text-sm text-gray-400">
                            Ticket Status
                        </span>

                        <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                                ticket.status === "active"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-red-500/10 text-red-400"
                            }`}
                        >
                            {ticket.status === "active"
                                ? "Active"
                                : "Used"}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
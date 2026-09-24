"use client";

import { useEffect, useState } from "react";
import {
    CalendarDays,
    Ticket,
    Users,
    UserRound,
    ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { registrationService } from "@/lib/registrationApi";
import Navbar from "@/components/navbar";

interface MyRegistration {
    _id: string;

    eventId: {
        _id: string;
        eventName: string;
        description: string;
        eventType: "free" | "paid";
        registrationType: "individual" | "team";
        maxParticipants: number;
        registrationStartDate: string;
        registrationEndDate: string;
        eventDate: string;
        eventEndDate: string;
        certificateEnabled: boolean;
        status: string;
    };

    participantId: string;
    phoneNumber: string;
    collegeOrOrganization?: string;

    createdAt: string;
    updatedAt: string;
}

export default function MyRegistrationsPage() {
    const router = useRouter();

    const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                setLoading(true);

                const response =
                    await registrationService.myRegistrations();

                setRegistrations(response.data || []);
            } catch (error) {
                console.error("Failed to fetch registrations:", error);
                setError("Failed to load your registrations.");
            } finally {
                setLoading(false);
            }
        };

        fetchRegistrations();
    }, []);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Loading
    if (loading) {
        return (
<>
        
           <main className="min-h-screen bg-[#080D17] text-white">

                <div className="mx-auto max-w-6xl">
                    <div className="animate-pulse">
                        <div className="mb-3 h-8 w-64 rounded bg-[#182131]" />
                        <div className="h-5 w-96 rounded bg-[#182131]" />

                        <div className="mt-8 grid gap-6 md:grid-cols-2">
                            {[1, 2].map((item) => (
                                <div
                                    key={item}
                                    className="h-72 rounded-2xl border border-[#263044] bg-[#0D1422]"
                                    />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        
      </>
        );
    }

    // Error
    if (error) {
        return (
            <main className="min-h-screen bg-[#080D17] px-6 py-10 text-white">
                <div className="mx-auto max-w-6xl">
                    <h1 className="text-3xl font-bold">
                        My Registrations
                    </h1>

                    <div className="mt-8 rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-red-400">
                        {error}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <>
        <Navbar />
        <main className="min-h-screen bg-[#080D17] px-6 py-10 text-white">
            <div className="mx-auto max-w-6xl">

                {/* PAGE HEADER */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5A623]">
                            <Ticket
                                size={21}
                                className="text-[#11151D]"
                            />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                My Registrations
                            </h1>

                            <p className="mt-1 text-sm text-[#8290A8]">
                                View and manage the events you have
                                registered for.
                            </p>
                        </div>
                    </div>
                </div>

                {/* EMPTY STATE */}
                {registrations.length === 0 ? (
                    <div className="rounded-2xl border border-[#263044] bg-[#0D1422] p-12 text-center shadow-xl">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#172235]">
                            <Ticket
                                size={30}
                                className="text-[#F5A623]"
                            />
                        </div>

                        <h2 className="mt-5 text-xl font-semibold text-white">
                            No registrations yet
                        </h2>

                        <p className="mt-2 text-sm text-[#8290A8]">
                            You haven't registered for any events yet.
                        </p>

                        <button
                            type="button"
                            onClick={() => router.push("/events")}
                            className="mt-6 rounded-xl bg-[#F5A623] px-6 py-3 font-semibold text-[#11151D] transition hover:bg-[#FFB52E]"
                        >
                            Browse Events
                        </button>
                    </div>
                ) : (
                    <>
                        {/* RESULT HEADER */}
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-white">
                                    Your Events
                                </h2>

                                <p className="mt-1 text-sm text-[#687993]">
                                    {registrations.length}{" "}
                                    {registrations.length === 1
                                        ? "registration"
                                        : "registrations"}{" "}
                                    found
                                </p>
                            </div>
                        </div>

                        {/* REGISTRATION CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-[450px] gap-6">
                            {registrations.map((registration) => {
                                const event = registration.eventId;

                                return (
                                    <div
                                        key={registration._id}
                                        className="group overflow-hidden rounded-2xl border border-[#263044] bg-[#0D1422] shadow-lg transition duration-300 hover:-translate-y-1 hover:border-[#3A465D] hover:shadow-2xl"
                                    >
                                        {/* CARD TOP */}
                                        <div className="border-b border-[#263044] p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h2 className="truncate text-xl font-bold text-white">
                                                        {event.eventName}
                                                    </h2>

                                                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#8290A8]">
                                                        {event.description}
                                                    </p>
                                                </div>

                                                {/* STATUS */}
                                                <span className="shrink-0 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium capitalize text-green-400">
                                                    {event.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* EVENT INFORMATION */}
                                        <div className="grid grid-cols-2 gap-4 p-6">

                                            {/* EVENT DATE */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                                                    <CalendarDays
                                                        size={18}
                                                        className="text-blue-400"
                                                    />
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#687993]">
                                                        Event Date
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-white">
                                                        {formatDate(
                                                            event.eventDate
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* REGISTRATION TYPE */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                                                    {event.registrationType ===
                                                    "team" ? (
                                                        <Users
                                                            size={18}
                                                            className="text-purple-400"
                                                        />
                                                    ) : (
                                                        <UserRound
                                                            size={18}
                                                            className="text-purple-400"
                                                        />
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#687993]">
                                                        Registration
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium capitalize text-white">
                                                        {
                                                            event.registrationType
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {/* EVENT TYPE */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5A623]/10">
                                                    <Ticket
                                                        size={18}
                                                        className="text-[#F5A623]"
                                                    />
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#687993]">
                                                        Event Type
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium capitalize text-white">
                                                        {event.eventType}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* REGISTERED DATE */}
                                            <div className="flex items-center">
                                                <div>
                                                    <p className="text-xs text-[#687993]">
                                                        Registered On
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-white">
                                                        {formatDate(
                                                            registration.createdAt
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* REGISTRATION ID */}
                                        <div className="mx-6 rounded-xl border border-[#263044] bg-[#080D17] p-4">
                                            <p className="text-xs text-[#687993]">
                                                Registration ID
                                            </p>

                                            <p className="mt-1 truncate font-mono text-sm text-[#C4CEDD]">
                                                {registration._id}
                                            </p>
                                        </div>

                                        {/* BUTTON */}
                                        <div className="p-6">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    console.log(
                                                        "View ticket:",
                                                        registration._id
                                                    )
                                                }
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5A623] py-3 font-semibold text-[#11151D] transition hover:bg-[#FFB52E]"
                                            >
                                                <Ticket size={18} />
                                                View Ticket
                                                <ArrowRight
                                                    size={17}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </main>
    
    </>
    );
}
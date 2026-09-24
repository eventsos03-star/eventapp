"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";


import { eventService, type EventRecord } from "@/lib/eventApi";
import IndividualRegistrationForm from "@/components/registration/IndividualRegistrationForm";
import TeamRegistrationForm from "@/components/registration/TeamRegistrationForm";

export default function EventRegistrationPage() {
    const { id } = useParams<{ id: string }>();

    const [event, setEvent] = useState<EventRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
   

    useEffect(() => {
        let cancelled = false;

        eventService
            .publicGetById(id)
            .then((res) => {
                if (!cancelled) {
                    setEvent(res.data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(
                        err?.response?.data?.message ??
                        "Failed to load event"
                    );
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return <div>Loading event...</div>;
    }

    if (error || !event) {
        return (
            <div>
                {error ?? "Event not found"}
            </div>
        );
    }

   return (
    <div>
       

        {event.registrationType === "individual" && (
            <IndividualRegistrationForm event={event} eventId={id}/>
        )}

        {event.registrationType === "team" && (
    <TeamRegistrationForm
        event={event}
        eventId={id}
    />
)}
    </div>
);
}
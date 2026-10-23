"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { registrationService } from "@/lib/registrationApi";
import { toast } from "react-toastify";
import RegistrationSuccessModal from "./RegistrationSuccessModal";
import { useRouter } from "next/navigation";
import { paymentService } from "@/lib/paymentApi";

interface IndividualRegistrationFormProps {
    eventId: string;
    event: {
        eventName: string;
        eventType: "free" | "paid";
        ticketPrice?: number;
    };
}

// Convert backend validation errors into user-friendly toast messages
const getErrorMessage = (error: any, fallback: string) => {
    const message = error?.response?.data?.message;

    if (!message || typeof message !== "string") {
        return fallback;
    }

    // Example: body.phoneNumber: Phone number must contain exactly 10 digits
    return message
        .replace(/body\./g, "")
        .replace(/params\./g, "")
        .replace(/query\./g, "")
        .replace(/phoneNumber/g, "Phone number")
        .replace(/collegeOrOrganization/g, "College or organization");
};

export default function IndividualRegistrationForm({
    event,
    eventId,
}: IndividualRegistrationFormProps) {
    const { user } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [collegeOrOrganization, setCollegeOrOrganization] = useState("");

    const router = useRouter();

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [registrationId, setRegistrationId] = useState("");

    const isPaid = event.eventType === "paid";

    const totalAmount = isPaid
        ? event.ticketPrice ?? 0
        : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent duplicate submissions
        if (submitting) {
            return;
        }

        // Validate phone number
        const trimmedPhoneNumber = phoneNumber.trim();

        if (!/^[6-9][0-9]{9}$/.test(trimmedPhoneNumber)) {
            toast.error(
                "Enter a valid 10-digit Indian mobile number"
            );
            return;
        }

        // Validate college or organization
        const trimmedCollegeOrOrganization =
            collegeOrOrganization.trim();

        if (!trimmedCollegeOrOrganization) {
            toast.error(
                "College or organization is required"
            );
            return;
        }

        try {
            setSubmitting(true);

            // ==============================
            // FREE EVENT REGISTRATION
            // ==============================

            if (!isPaid) {
                const response =
                    await registrationService.individual(
                        eventId,
                        {
                            phoneNumber: trimmedPhoneNumber,
                            collegeOrOrganization:
                                trimmedCollegeOrOrganization,
                        }
                    );

                const newRegistrationId =
                    response?.registration?._id ||
                    response?.registrationId ||
                    "";

                setRegistrationId(newRegistrationId);

                setShowSuccessModal(true);

                return;
            }

            // ==============================
            // PAID EVENT REGISTRATION
            // ==============================

            const response =
                await paymentService.createOrder(eventId);

            const {
                orderId,
                amount,
                currency,
            } = response.data;

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount,
                currency,
                name: "EventOS",
                description: event.eventName,
                order_id: orderId,

                prefill: {
                    name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`,
                    email: user?.email ?? "",
                    contact: trimmedPhoneNumber,
                },

                handler: async function (
                    razorpayResponse: {
                        razorpay_payment_id: string;
                        razorpay_order_id: string;
                        razorpay_signature: string;
                    }
                ) {
                    try {
                        const verifyResponse =
                            await paymentService.verifyPayment({
                                razorpay_order_id:
                                    razorpayResponse.razorpay_order_id,

                                razorpay_payment_id:
                                    razorpayResponse.razorpay_payment_id,

                                razorpay_signature:
                                    razorpayResponse.razorpay_signature,

                                eventId,

                                registrationType: "individual",

                                phoneNumber: trimmedPhoneNumber,

                                collegeOrOrganization:
                                    trimmedCollegeOrOrganization,
                            });

                        console.log(
                            "Payment verification response:",
                            verifyResponse
                        );

                        const registration =
                            verifyResponse?.data?.registration;

                        const newRegistrationId =
                            registration?._id ||
                            verifyResponse?.data?.registrationId ||
                            "";

                        setRegistrationId(newRegistrationId);

                        setShowSuccessModal(true);

                    } catch (error: any) {
                        toast.error(
                            getErrorMessage(
                                error,
                                "Payment verification failed"
                            )
                        );
                    } finally {
                        setSubmitting(false);
                    }
                },

                modal: {
                    ondismiss: function () {
                        console.log("Razorpay checkout closed");

                        setSubmitting(false);
                    },
                },

                theme: {
                    color: "#f59e0b",
                },
            };

            console.log("Razorpay key:", options.key);
console.log("Razorpay order ID:", options.order_id);
console.log("Razorpay amount:", options.amount);
console.log("Razorpay currency:", options.currency);

            const razorpay = new window.Razorpay(options);


            razorpay.open();

        } catch (error: any) {
            toast.error(
                getErrorMessage(
                    error,
                    "Registration failed"
                )
            );

            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#090d16] px-6 py-10 text-white">

            <div className="mx-auto max-w-6xl">

                {/* Back */}
                <Link
                    href={`/events/${eventId}`}
                    className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                >
                    ← Back to event
                </Link>

                {/* Main Grid */}
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

                    {/* LEFT SIDE */}
                    <div className="rounded-2xl border border-slate-800 bg-[#0d172a] p-7">

                        {/* Header */}
                        <div className="border-b border-slate-800 pb-6">

                            <div className="mb-3 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-400">
                                Individual Registration
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight">
                                {event.eventName}
                            </h1>

                            <p className="mt-2 text-sm text-slate-400">
                                Complete your information to register
                                for this event.
                            </p>

                        </div>

                        {/* Participant Information */}
        <div className="mt-7">

            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-300">
                Participant Information
            </h2>

            {/* Full Name */}
            <div className="mb-5">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                    Full Name
                </label>

                <input
                    type="text"
                    value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                    readOnly
                    className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-slate-300 outline-none"
                />

            </div>

            {/* Email + Phone */}
            <div className="grid gap-5 md:grid-cols-2">

                <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Email Address
                    </label>

                    <input
                        type="email"
                        value={user?.email ?? ""}
                        readOnly
                        className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-slate-300 outline-none"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                        Your account information cannot
                        be changed here.
                    </p>

                </div>

                {/* Phone Number */}
                <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Phone Number
                        <span className="ml-1 text-orange-400">
                            *
                        </span>
                    </label>

                    <input
                        type="tel"
                        form="individual-registration-form"
                        value={phoneNumber}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");

                            if (value.length <= 10) {
                                setPhoneNumber(value);
                            }
                        }}
                        placeholder="Enter 10-digit phone number"
                        maxLength={10}
                        pattern="[6-9][0-9]{9}"
                        title="Enter a valid 10-digit  number"

                        required
                        className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />

                </div>

            </div>

            {/* Additional Information */}
            <div className="mt-8">

                <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Additional Information
                </h2>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                    College / Organization
                    <span className="ml-1 text-orange-400">
                        *
                    </span>
                </label>

                <input
                    type="text"
                    form="individual-registration-form"
                    value={collegeOrOrganization}
                    onChange={(e) =>
                        setCollegeOrOrganization(e.target.value)
                    }
                    placeholder="Enter your institution or company"
                    required
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

            </div>

            {/* Terms */}
            <div className="mt-7 rounded-lg border border-slate-800 bg-[#111c2f] p-4">

                <label className="flex cursor-pointer gap-3">

                    <input
                        type="checkbox"
                        form="individual-registration-form"
                        required
                        className="mt-1 h-4 w-4 accent-orange-500"
                    />

                    <span className="text-xs leading-5 text-slate-400">
                        I confirm that the information
                        provided is correct and agree to
                        the event terms and conditions.
                    </span>

                </label>

            </div>

        </div>

        {/* Mobile button */}
        <div className="mt-7 lg:hidden">

            <button
                type="submit"
                form="individual-registration-form"
                disabled={submitting}
                className="w-full rounded-lg bg-orange-500 px-5 py-3.5 font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting
                    ? "Registering..."
                    : isPaid
                        ? "Continue to Payment →"
                        : "Register for Event"}
            </button>

        </div>

    </div>

    {/* RIGHT SIDE */}
    <div className="h-fit rounded-2xl border border-slate-800 bg-[#0d172a] p-6">

        <h2 className="text-lg font-semibold">
            Registration Summary
        </h2>

        <div className="my-5 border-t border-slate-800" />

        {/* Event */}
        <div className="flex justify-between gap-4 py-2">

            <span className="text-sm text-slate-500">
                Event
            </span>

            <span className="text-right text-sm font-medium text-slate-200">
                {event.eventName}
            </span>

        </div>

        {/* Type */}
        <div className="flex justify-between py-2">

            <span className="text-sm text-slate-500">
                Type
            </span>

            <span className="text-sm text-slate-300">
                Individual
            </span>

        </div>

        {/* Participant */}
        <div className="flex justify-between py-2">

            <span className="text-sm text-slate-500">
                Participant
            </span>

            <span className="text-sm text-slate-300">
                {user?.firstName} {user?.lastName}
            </span>

        </div>

        <div className="my-5 border-t border-slate-800" />

        {/* Price */}
        <div className="flex justify-between py-2">

            <span className="text-sm text-slate-500">
                Registration Fee
            </span>

            <span
                className={`text-sm font-semibold ${
                    isPaid
                        ? "text-white"
                        : "text-emerald-400"
                }`}
            >
                {isPaid
                    ? `₹${totalAmount}`
                    : "Free"}
            </span>

        </div>

        {/* Total */}
        <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-5">

            <span className="font-semibold text-slate-200">
                Total
            </span>

            <span className="text-2xl font-bold text-orange-400">
                {isPaid
                    ? `₹${totalAmount}`
                    : "Free"}
            </span>

        </div>

        {/* Submit */}
        <form
            id="individual-registration-form"
            onSubmit={handleSubmit}
            className="mt-6"
        >

            <button
                type="submit"
                disabled={submitting}
                className="hidden w-full rounded-lg bg-orange-500 px-5 py-3.5 font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 lg:block"
            >
                {submitting
                    ? "Registering..."
                    : isPaid
                        ? "Continue to Payment →"
                        : "Register for Event"}
            </button>

        </form>

    </div>

</div>

<RegistrationSuccessModal
    isOpen={showSuccessModal}
    eventName={event.eventName}
    registrationId={registrationId}
    registrationType="individual"
    onViewRegistration={() => {
        router.push("/my-registrations");
    }}
    onBackToEvents={() => {
        router.push("/events");
    }}
/>
</div>
 </div>
);
}
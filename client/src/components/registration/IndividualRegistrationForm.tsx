"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { registrationService } from "@/lib/registrationApi";
import {toast} from "react-toastify"
import RegistrationSuccessModal from "./RegistrationSuccessModal";
import { useRouter } from "next/navigation";
import { paymentService } from "@/lib/paymentApi";

interface IndividualRegistrationFormProps {
    eventId:string;
    event: {
        eventName: string;
        eventType: "free" | "paid";
        ticketPrice?: number;
    };
}

export default function IndividualRegistrationForm({
    event,eventId,
}: IndividualRegistrationFormProps) {
    const {user}=useAuth();

    const [phoneNumber, setPhoneNumber] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [collegeOrOrganization, setCollegeOrOrganization] =useState("");
     const router=useRouter();
        const [showSuccessModal,setShowSuccessModal]=useState(false);
        const [registrationId, setRegistrationId] = useState("");

    const isPaid = event.eventType === "paid";

    const totalAmount = isPaid
        ? event.ticketPrice ?? 0
        : 0;

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        try{
            setSubmitting(true);

            if(!isPaid){
           const response= await registrationService.individual(eventId,
                {phoneNumber,collegeOrOrganization:collegeOrOrganization||undefined});

                  setRegistrationId(
    response?.registration?._id ||
    response?.registrationId ||
    ""
  );

  setShowSuccessModal(true);

   return 
}

    const response=await paymentService.createOrder(eventId);

const { orderId, amount, currency, paymentId } = response;
 const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    amount,
    currency,
    name: "EventOs",
    description: event.eventName,
    order_id: orderId,



          prefill: {
        name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`,
        email: user?.email ?? "",
    },
  handler: async function (razorpayResponse: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }) {
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
                    phoneNumber,
                    collegeOrOrganization:
                        collegeOrOrganization || undefined,
                });

            console.log(
                "Payment verification response:",
                verifyResponse
            );

              const registration =
                verifyResponse?.data?.registration;

            setRegistrationId(
                registration?._id ||
                verifyResponse?.data?.registrationId ||
                ""
            );

            setShowSuccessModal(true);


       } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                "Payment verification failed"
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

const razorpay = new window.Razorpay(options);

razorpay.open();



                
        }catch(error:any){
            toast.error(
            error?.response?.data?.message ??
                "Registration failed"
        );
    
        }finally{
            setSubmitting(false)
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


                                <div>

                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Phone Number
                                        <span className="ml-1 text-orange-400">
                                            *
                                        </span>
                                    </label>

                                   <input
  type="tel"
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
  className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
  required
/>
                                </div>

                            </div>


                            {/* Additional Information */}
                            <div className="mt-8">

                                <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-300">
                                    Additional Information
                                    <span className="ml-2 text-xs font-normal normal-case text-slate-500">
                                        Optional
                                    </span>
                                </h2>


                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    College / Organization
                                </label>

                                <input
                                    type="text"
                                    value={collegeOrOrganization}
                                    onChange={(e) =>
                                        setCollegeOrOrganization(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your institution or company"
                                    className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />

                            </div>


                            {/* Terms */}
                            <div className="mt-7 rounded-lg border border-slate-800 bg-[#111c2f] p-4">

                                <label className="flex cursor-pointer gap-3">

                                    <input
                                        type="checkbox"
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
                            className="w-full rounded-lg bg-orange-500 px-5 py-3.5 font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
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
    );
}
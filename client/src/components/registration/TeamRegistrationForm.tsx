"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { registrationService } from "@/lib/registrationApi";
import {toast} from "react-toastify"
import RegistrationSuccessModal from "./RegistrationSuccessModal";
import { useRouter } from "next/navigation";
import { paymentService } from "@/lib/paymentApi";


interface TeamMember {
    name: string;
    email: string;
    phoneNumber: string;
    collegeOrOrganization: string;
}

interface TeamRegistrationFormProps {
    eventId: string;
    event: {
        eventName: string;
        eventType: "free" | "paid";
        ticketPrice?: number;
        teamSize?: number;
    };
}

export default function TeamRegistrationForm({
    eventId,
    event,
}: TeamRegistrationFormProps) {
    const {user}=useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [captainPhoneNumber, setCaptainPhoneNumber] = useState("");
    const [captainCollegeOrOrganization, setCaptainCollegeOrOrganization] =
    useState("");
    const [members, setMembers] = useState<TeamMember[]>([]);
    const router = useRouter();

const [showSuccessModal, setShowSuccessModal] = useState(false);
const [registrationId, setRegistrationId] = useState("");
  const additionalMemberCount = Math.max(
        (event.teamSize ?? 1) - 1,
        0
    );
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [newMember, setNewMember] = useState<TeamMember>({
        name: "",
        email: "",
        phoneNumber: "",
        collegeOrOrganization: "",
    });

    const [editingMemberIndex, setEditingMemberIndex] = useState<
        number | null
    >(null);

    const isPaid = event.eventType === "paid";

    const totalAmount = isPaid
        ? (event.ticketPrice ?? 0) * (event.teamSize ?? 1)
        : 0;

    const openAddMemberModal = () => {
        if (members.length >= additionalMemberCount) {
            return;
        }

        setEditingMemberIndex(null);

        setNewMember({
            name: "",
            email: "",
            phoneNumber: "",
            collegeOrOrganization: "",
        });

        setIsMemberModalOpen(true);
    };

    /*
     * ---------------------------------------------------------
     * CLOSE MEMBER MODAL
     * ---------------------------------------------------------
     */

    const closeMemberModal = () => {
        setIsMemberModalOpen(false);

        setEditingMemberIndex(null);

        setNewMember({
            name: "",
            email: "",
            phoneNumber: "",
            collegeOrOrganization: "",
        });
    };

   

    const handleSaveMember = () => {
        
        if (!newMember.name.trim()) {
            alert("Please enter member name");
            return;
        }

        if (!newMember.email.trim()) {
            alert("Please enter member email");
            return;
        }

        

        if (editingMemberIndex !== null) {
            setMembers((currentMembers) =>
                currentMembers.map((member, index) =>
                    index === editingMemberIndex
                        ? newMember
                        : member
                )
            );

            closeMemberModal();
            return;
        }

        
        if (members.length >= additionalMemberCount) {
            alert("Maximum team members reached");
            return;
        }

        setMembers((currentMembers) => [
            ...currentMembers,
            newMember,
        ]);

        closeMemberModal();
    };

   

    const handleEditMember = (index: number) => {
        setNewMember(members[index]);

        setEditingMemberIndex(index);

        setIsMemberModalOpen(true);
    };

  

    const handleRemoveMember = (index: number) => {
        setMembers((currentMembers) =>
            currentMembers.filter(
                (_, memberIndex) => memberIndex !== index
            )
        );
    };

    

    const handleSubmit =async (e: React.FormEvent) => {
        e.preventDefault();

        if (!teamName.trim()) {
             toast.error("Please enter team name");
        return;
        }
 if (!captainPhoneNumber.trim()) {
        toast.error("Please enter captain phone number");
        return;
    }


        const totalMembers = members.length + 1;

        if (totalMembers !== event.teamSize) {
           toast.error(
            `Your team must have exactly ${event.teamSize} members.`
        );
        return;
        }

        try{
            setSubmitting(true);

            if(!isPaid){

           const response= await registrationService.team(eventId,{teamName,phoneNumber:captainPhoneNumber
                , collegeOrOrganization:captainCollegeOrOrganization ||undefined,members,
            });
 setRegistrationId(
        response?.registration?._id ||
        response?.registrationId ||
        ""
    );

    setShowSuccessModal(true);

    return 

}


    const response=await paymentService.createOrder(eventId);

    const {orderId,amount,currency,paymentId}=response.data;

    const options={
        key:process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount,
        currency,
        name:"EventOs",
        description: event.eventName,
         order_id: orderId,

 
         prefill: {
            name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`,
            email: user?.email ?? "",
        },
        handler: async function (razorpayResponse:{ razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;}) {
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
                registrationType: "team",
                phoneNumber:captainPhoneNumber,
              
                collegeOrOrganization:
                    captainCollegeOrOrganization || undefined,
                teamName,
                members,
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
        "Team registration failed"
    );
    }finally{
            setSubmitting(false)
        }

    };

    return (
        <div className="min-h-screen bg-[#090d16] px-6 py-10 text-white">

            <div className="mx-auto max-w-6xl">

                {/* ------------------------------------------------
                    BACK
                ------------------------------------------------ */}

                <Link
                    href={`/events/${eventId}`}
                    className="mb-6 block text-sm text-slate-400 transition hover:text-white"
                >
                    ← Back to event
                </Link>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

                    {/* =================================================
                        LEFT SIDE
                    ================================================= */}

                    <div className="rounded-2xl border border-slate-800 bg-[#0d172a] p-7">

                        {/* ------------------------------------------------
                            HEADER
                        ------------------------------------------------ */}

                        <div className="border-b border-slate-800 pb-6">

                            <div className="mb-3 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-400">
                                Team
                            </div>

                            <h1 className="text-3xl font-bold">
                                {event.eventName}
                            </h1>

                            <p className="mt-2 text-sm text-slate-400">
                                Create your team and add your members
                                to register for this event.
                            </p>

                        </div>

                        <form
                            id="team-registration-form"
                            onSubmit={handleSubmit}
                            className="mt-7"
                        >

                            {/* =================================================
                                TEAM INFORMATION
                            ================================================= */}

                            <div>

                                <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-300">
                                    Team Information
                                </h2>

                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Team Name

                                    <span className="ml-1 text-orange-400">
                                        *
                                    </span>
                                </label>

                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) =>
                                        setTeamName(e.target.value)
                                    }
                                    placeholder="Enter your team name"
                                    required
                                    className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />

                            </div>

                            {/* =================================================
                                TEAM MEMBERS
                            ================================================= */}

                            <div className="mt-9">

                                {/* Header */}

                                <div className="mb-5 flex items-center justify-between">

                                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                                        Team Members
                                    </h2>

                                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                                        {members.length + 1} /{" "}
                                        {event.teamSize} Members
                                    </span>

                                </div>

                                {/* =================================================
                                    CAPTAIN
                                ================================================= */}

                                <div className="mb-4 rounded-xl border border-blue-500/20 bg-[#111c2f] p-5">

                                    {/* Captain header */}

                                    <div className="flex items-start justify-between">

                                        <div>

                                            <p className="font-medium text-white">
                                                {user?.firstName ?? ""} {user?.lastName ?? ""}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                {user?.email}
                                            </p>

                                        </div>

                                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                                            CAPTAIN
                                        </span>

                                    </div>

                                    {/* Captain extra information */}

                                    <div className="mt-5 grid gap-5 md:grid-cols-2">

                                        {/* Phone */}

                                        <div>

                                            <label className="mb-2 block text-sm text-slate-400">
                                                Phone Number
                                                <span className="ml-1 text-orange-400">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="tel"
                                                value={captainPhoneNumber}
                                                onChange={(e) =>
                                                    setCaptainPhoneNumber(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Captain phone number"
                                                required
                                                className="w-full rounded-lg border border-slate-700 bg-[#0d172a] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                                            />

                                        </div>

                                        {/* College */}

                                        <div>

                                            <label className="mb-2 block text-sm text-slate-400">
                                                College / Organization
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    captainCollegeOrOrganization
                                                }
                                                onChange={(e) =>
                                                    setCaptainCollegeOrOrganization(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="College or organization"
                                                className="w-full rounded-lg border border-slate-700 bg-[#0d172a] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                                            />

                                        </div>

                                    </div>

                                </div>

                                {/* =================================================
                                    ADDED MEMBERS
                                ================================================= */}

                                {members.map((member, index) => (

                                    <div
                                        key={index}
                                        className="mb-4 rounded-xl border border-slate-800 bg-[#111c2f] p-5"
                                    >

                                        <div className="flex items-start justify-between gap-4">

                                            <div>

                                                <div className="mb-2 flex items-center gap-3">

                                                    <h3 className="font-medium text-white">
                                                        Member {index + 1}
                                                    </h3>

                                                </div>

                                                <p className="text-sm text-slate-300">
                                                    {member.name}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {member.email}
                                                </p>

                                                {member.phoneNumber && (
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {member.phoneNumber}
                                                    </p>
                                                )}

                                                {member.collegeOrOrganization && (
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {
                                                            member.collegeOrOrganization
                                                        }
                                                    </p>
                                                )}

                                            </div>

                                            {/* Actions */}

                                            <div className="flex shrink-0 gap-3">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEditMember(index)
                                                    }
                                                    className="text-sm text-blue-400 transition hover:text-blue-300"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveMember(
                                                            index
                                                        )
                                                    }
                                                    className="text-sm text-red-400 transition hover:text-red-300"
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                                {/* =================================================
                                    ADD MEMBER BUTTON
                                ================================================= */}

                                {members.length <
                                    additionalMemberCount && (

                                    <button
                                        type="button"
                                        onClick={openAddMemberModal}
                                        className="mt-4 w-full rounded-xl border border-dashed border-blue-500/40 bg-blue-500/5 px-4 py-4 text-sm font-medium text-blue-400 transition hover:border-blue-500/70 hover:bg-blue-500/10"
                                    >
                                        + Add Member
                                    </button>

                                )}

                                {/* Team complete message */}

                                {members.length ===
                                    additionalMemberCount &&
                                    additionalMemberCount > 0 && (

                                    <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                                        ✓ Team is complete
                                    </div>

                                )}

                            </div>

                            {/* =================================================
                                TERMS
                            ================================================= */}

                            <div className="mt-7 rounded-lg border border-slate-800 bg-[#111c2f] p-4">

                                <label className="flex cursor-pointer gap-3">

                                    <input
                                        type="checkbox"
                                        required
                                        className="mt-1 h-4 w-4 accent-orange-500"
                                    />

                                    <span className="text-xs leading-5 text-slate-400">
                                        I confirm that the team information
                                        is correct and agree to the event
                                        terms and conditions.
                                    </span>

                                </label>

                            </div>

                            {/* =================================================
                                MOBILE SUBMIT
                            ================================================= */}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="mt-6 w-full rounded-lg bg-orange-500 px-5 py-3.5 font-semibold text-black transition hover:bg-orange-400 lg:hidden"
                            >
                                 {submitting
        ? "Registering..."
        : isPaid
          ? "Continue to Payment →"
          : "Register Team"}
                            </button>

                        </form>

                    </div>

                    {/* =================================================
                        RIGHT SIDE - SUMMARY
                    ================================================= */}

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
                                Team
                            </span>

                        </div>

                        {/* Team Size */}

                        <div className="flex justify-between py-2">

                            <span className="text-sm text-slate-500">
                                Team Size
                            </span>

                            <span className="text-sm text-slate-300">
                                {event.teamSize}
                            </span>

                        </div>

                        <div className="my-5 border-t border-slate-800" />

                        {/* Registration Fee */}

                        <div className="flex justify-between py-2">

                            <span className="text-sm text-slate-500">
                                Registration Fee
                            </span>

                            <span
                                className={
                                    isPaid
                                        ? "text-sm font-semibold text-white"
                                        : "text-sm font-semibold text-emerald-400"
                                }
                            >
                                {isPaid
                                    ? `₹${event.ticketPrice ?? 0} / participant`
                                    : "Free"}
                            </span>

                        </div>

                        {/* Participants */}

                        {isPaid && (
                            <div className="flex justify-between py-2">

                                <span className="text-sm text-slate-500">
                                    Participants
                                </span>

                                <span className="text-sm text-slate-300">
                                    {event.teamSize}
                                </span>

                            </div>
                        )}

                        {/* Total */}

                        <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-5">

                            <span className="font-semibold text-slate-200">
                                Total
                            </span>

                            <span className="text-2xl font-bold text-orange-400">
                                {isPaid
                                    ? `₹${totalAmount}`
                                    : "Free"}
                            </span>

                        </div>

                        {/* Desktop submit */}

                        <button
                            type="submit"
                            form="team-registration-form"
                            disabled={submitting}
                            className="mt-6 w-full rounded-lg bg-orange-500 px-5 py-3.5 font-semibold text-black transition hover:bg-orange-400"
                        >
                            {submitting
    ? "Registering..."
    : isPaid
      ? "Continue to Payment →"
      : "Register Team"}
                        </button>

                     

                    </div>

                </div>

            </div>

            {/* =========================================================
                ADD / EDIT MEMBER MODAL
            ========================================================= */}

            {isMemberModalOpen && (

                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={closeMemberModal}
                >

                    <div
                        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0d172a] p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Modal Header */}

                        <div className="mb-6 flex items-start justify-between">

                            <div>

                                <h2 className="text-lg font-semibold text-white">
                                    {editingMemberIndex !== null
                                        ? "Edit Team Member"
                                        : "Add Team Member"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Enter the member details below.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={closeMemberModal}
                                className="text-lg text-slate-400 transition hover:text-white"
                            >
                                ✕
                            </button>

                        </div>

                        {/* Modal Form */}

                        <div className="space-y-5">

                            {/* Name */}

                            <div>

                                <label className="mb-2 block text-sm text-slate-400">
                                    Full Name
                                    <span className="ml-1 text-orange-400">
                                        *
                                    </span>
                                </label>

                                <input
                                    type="text"
                                    value={newMember.name}
                                    onChange={(e) =>
                                        setNewMember({
                                            ...newMember,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Enter full name"
                                    className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                                />

                            </div>

                            {/* Email */}

                            <div>

                                <label className="mb-2 block text-sm text-slate-400">
                                    Email
                                    <span className="ml-1 text-orange-400">
                                        *
                                    </span>
                                </label>

                                <input
                                    type="email"
                                    value={newMember.email}
                                    onChange={(e) =>
                                        setNewMember({
                                            ...newMember,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="member@example.com"
                                    className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                                />

                            </div>

                            {/* Phone */}

                            <div>

                                <label className="mb-2 block text-sm text-slate-400">
                                    Phone Number
                                </label>

                               <input
  type="tel"
  value={captainPhoneNumber}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 10) {
      setCaptainPhoneNumber(value);
    }
  }}
  placeholder="Enter 10-digit phone number"
  maxLength={10}
  pattern="[6-9][0-9]{9}"
  className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
  required
/>

                            </div>

                            {/* College */}

                            <div>

                                <label className="mb-2 block text-sm text-slate-400">
                                    College / Organization
                                </label>

                                <input
                                    type="text"
                                    value={
                                        newMember.collegeOrOrganization
                                    }
                                    onChange={(e) =>
                                        setNewMember({
                                            ...newMember,
                                            collegeOrOrganization:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="College or organization"
                                    className="w-full rounded-lg border border-slate-700 bg-[#111c2f] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                                />

                            </div>

                        </div>

                        {/* Modal Buttons */}

                        <div className="mt-7 flex gap-3">

                            <button
                                type="button"
                                onClick={closeMemberModal}
                                className="flex-1 rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveMember}
                                className="flex-1 rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
                            >
                                {editingMemberIndex !== null
                                    ? "Save Changes"
                                    : "Add Member"}
                            </button>

                        </div>

                    </div>

                </div>

            )}
            <RegistrationSuccessModal
  isOpen={showSuccessModal}
  eventName={event.eventName}
  registrationId={registrationId}
  registrationType="team"
  teamName={teamName}
  teamSize={members.length + 1}
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
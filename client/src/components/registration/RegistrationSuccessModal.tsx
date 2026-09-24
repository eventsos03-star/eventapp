"use client";

import { CheckCircle2, X } from "lucide-react";

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  eventName: string;
  registrationId?: string;
  registrationType: "individual" | "team";
  teamName?: string;
  teamSize?: number;
  onViewRegistration: () => void;
  onBackToEvents: () => void;
}

export default function RegistrationSuccessModal({
  isOpen,
  eventName,
  registrationId,
  registrationType,
  teamName,
  teamSize,
  onViewRegistration,
  onBackToEvents,
}: RegistrationSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        
        {/* Close */}
        <button
          type="button"
          onClick={onBackToEvents}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2
              size={38}
              className="text-green-600"
            />
          </div>
        </div>

        {/* Title */}
        <div className="mt-5 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Registration Successful
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            You are successfully registered for this event.
          </p>
        </div>

        {/* Registration Details */}
        <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4">
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-500">
              Event
            </span>

            <span className="text-right text-sm font-medium text-gray-900">
              {eventName}
            </span>
          </div>

          {registrationId && (
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">
                Registration ID
              </span>

              <span className="text-right text-sm font-medium text-gray-900">
                {registrationId}
              </span>
            </div>
          )}

          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-500">
              Type
            </span>

            <span className="text-sm font-medium capitalize text-gray-900">
              {registrationType}
            </span>
          </div>

          {registrationType === "team" && teamName && (
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">
                Team
              </span>

              <span className="text-right text-sm font-medium text-gray-900">
                {teamName}
              </span>
            </div>
          )}

          {registrationType === "team" && teamSize && (
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">
                Team Size
              </span>

              <span className="text-sm font-medium text-gray-900">
                {teamSize}
              </span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onViewRegistration}
            className="w-full rounded-xl bg-amber-500 py-3 font-medium text-white transition hover:bg-amber-600"
          >
            View My Registration
          </button>

          <button
            type="button"
            onClick={onBackToEvents}
            className="w-full rounded-xl border border-gray-300 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Back to Events
          </button>
        </div>
      </div>
    </div>
  );
}
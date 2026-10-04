import { emailLayout } from "./layout.js";

interface RegistrationEmailData {
  firstName: string;
  eventName: string;
  eventDate: string;
  registrationId: string;
  registrationType: "individual" | "team";
  teamName?: string;
  teamSize?: number;
}

export function registrationConfirmationTemplate(
  data: RegistrationEmailData
): string {
  const content = `
    <p>Hi ${data.firstName},</p>

    <p>
      Your registration for <strong>${data.eventName}</strong>
      has been successfully confirmed! 🎉
    </p>

    <h3>Event Details</h3>

    <p>
      <strong>Event:</strong> ${data.eventName}<br/>
      <strong>Date:</strong> ${data.eventDate}
    </p>

    <h3>Registration Details</h3>

    <p>
      <strong>Registration ID:</strong> ${data.registrationId}<br/>
      <strong>Registration Type:</strong> ${data.registrationType}
    </p>

    ${
      data.registrationType === "team"
        ? `
          <p>
            <strong>Team:</strong> ${data.teamName ?? "-"}<br/>
            <strong>Team Size:</strong> ${data.teamSize ?? "-"}
          </p>
        `
        : ""
    }

    <p>
      Your ticket has been generated successfully.
      Please keep your ticket ready when you arrive at the event.
    </p>

    <p>
      The organizer will scan your ticket during check-in.
    </p>

    <p style="text-align: center; margin: 32px 0;">
      <a
        href="${process.env.CLIENT_URL}/registrations"
        style="
          background-color: #6366f1;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 6px;
          font-weight: bold;
          display: inline-block;
        "
      >
        View My Registration
      </a>
    </p>

    <p>
      Thank you for registering with EventOS.
    </p>
  `;

  return emailLayout("Registration Confirmed", content);
}
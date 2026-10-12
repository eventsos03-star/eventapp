import Ticket from "./ticket.model.js";
import Registration from "./registration.model.js";
import Event from "./event.model.js";
import OrganizationMember from "../organization/organizationMember.model.js";
import { AppError } from "../../utils/AppError.js";
import Attendance from "./attendance.model.js";
import Team from "./team.model.js";

export const getTicket = async (registrationId: string, userId: string) => {
  const registration = await Registration.findOne({
    _id: registrationId,
    participantId: userId,
  })
    .populate("eventId")
    .populate("teamId");

  if (!registration) {
    throw new AppError("Registration not found", 404);
  }

  const ticket = await Ticket.findOne({ registrationId: registration._id });
  if (!ticket) {
    throw new AppError("Ticket not found", 404);
  }

  return { ticket, registration };
};

export const ticketVerification = async (
  ticketNumber: string,
  registrationId: string,
  organizerId: string,
  teamMemberId?: string
) => {
  const registration = await Registration.findById(registrationId);
  if (!registration) {
    throw new AppError("Registration not found", 404);
  }

  const eventId = registration.eventId;
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  if (event.status !== "ongoing") {
    throw new AppError(
      "Ticket check-in is available only for ongoing events",
      400
    );
  }

  const organizationMember = await OrganizationMember.findOne({
    organizationId: event.organizationId,
    userId: organizerId,
    inviteStatus: "accepted",
    isDeleted: false,
    role: {
      $in: ["owner", "organizer", "user_manager"],
    },
  });

  if (!organizationMember) {
    throw new AppError(
      "You are not authorized to verify tickets for this event",
      403
    );
  }

  const ticket = await Ticket.findOne({
    registrationId,
    ticketNumber,
    status: "active",
  });

  if (!ticket) {
    throw new AppError("Ticket is invalid or has already been used", 400);
  }

  if (!registration.teamId) {
    ticket.status = "used";
    await ticket.save();

    // Mark registration checkedIn
    (registration as any).checkedIn = true;
    (registration as any).checkedInAt = new Date();
    await registration.save();

    const attendance = await Attendance.create({
      eventId: event._id,
      registrationId: registration._id,
      ticketId: ticket._id,
      userId: registration.participantId,
      checkedInAt: new Date(),
      checkedInBy: organizerId,
    });

    return {
      ticket,
      registration,
      attendance,
    };
  }

  if (!teamMemberId) {
    throw new AppError("Please select the team member who is checking in", 400);
  }

  const team = await Team.findById(registration.teamId);
  if (!team) {
    throw new AppError("Team not found", 404);
  }

  const teamMember = team.members.find(
    (member) => member._id.toString() === teamMemberId
  );
  if (!teamMember) {
    throw new AppError("Team member not found", 404);
  }

  const existingAttendance = await Attendance.findOne({
    registrationId: registration._id,
    teamMemberId: teamMember._id,
  });

  if (existingAttendance) {
    throw new AppError("This team member has already checked in", 400);
  }

  const attendance = await Attendance.create({
    eventId: event._id,
    registrationId: registration._id,
    ticketId: ticket._id,
    teamMemberId: teamMember._id,
    checkedInAt: new Date(),
    checkedInBy: organizerId,
  });

  // Mark registration as checkedIn since at least one member has arrived
  (registration as any).checkedIn = true;
  (registration as any).checkedInAt = new Date();
  await registration.save();

  const attendedCount = await Attendance.countDocuments({
    registrationId: registration._id,
  });

  if (attendedCount >= team.members.length) {
    ticket.status = "used";
    await ticket.save();
  }

  return {
    ticket,
    registration,
    attendance,
    attendedCount,
    totalMembers: team.members.length,
  };
};

/**
 * Scans a ticket QR code:
 * - Checks event day validity.
 * - Individual: marks as checked in.
 * - Team: returns members and check-in statuses.
 */
export const scanAndVerifyTicket = async (
  eventId: string,
  ticketNumber: string,
  organizerId: string
) => {
  const cleanTicketNumber = ticketNumber.trim();

  const ticket = await Ticket.findOne({ ticketNumber: cleanTicketNumber });
  if (!ticket) {
    throw new AppError("Invalid ticket. Ticket number not found.", 404);
  }

  const registration: any = await Registration.findById(ticket.registrationId)
    .populate("participantId", "firstName lastName email")
    .populate("teamId");

  if (!registration) {
    throw new AppError("Registration record for this ticket not found.", 404);
  }

  if (registration.eventId.toString() !== eventId) {
    throw new AppError("This ticket belongs to a different event.", 400);
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  if (event.status === "cancelled") {
    throw new AppError("This event has been cancelled.", 400);
  }

  // Event day validation window
  const now = new Date();
  const eventStartDay = new Date(event.eventDate);
  eventStartDay.setHours(0, 0, 0, 0);

  const eventEndDay = new Date(event.eventEndDate ?? event.eventDate);
  eventEndDay.setHours(23, 59, 59, 999);

  if (now < eventStartDay) {
    const formattedStart = eventStartDay.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    throw new AppError(
      `Check-in is not open yet! Ticket scanning is only available on the event day (${formattedStart}).`,
      400
    );
  }

  if (now > eventEndDay) {
    throw new AppError(
      "This event has already ended. Ticket check-in is closed.",
      400
    );
  }

  // ==========================================
  // CASE A: INDIVIDUAL TICKET
  // ==========================================
  if (!registration.teamId) {
    if (ticket.status === "used" || registration.checkedIn) {
      throw new AppError("Ticket has already been used and checked in.", 400);
    }

    ticket.status = "used";
    await ticket.save();

    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    await registration.save();

    const attendance = await Attendance.create({
      eventId,
      registrationId: registration._id,
      ticketId: ticket._id,
      userId: registration.participantId?._id,
      checkedInAt: new Date(),
      checkedInBy: organizerId,
    });

    const attendeeName =
      `${registration.participantId?.firstName ?? ""} ${registration.participantId?.lastName ?? ""}`.trim() ||
      "Attendee";

    return {
      isTeam: false,
      message: `Verified: ${attendeeName} checked in successfully!`,
      ticket,
      registration,
      attendance,
    };
  }

  // ==========================================
  // CASE B: TEAM TICKET
  // ==========================================
  const team: any = registration.teamId;
  if (!team) {
    throw new AppError("Team record not found for this ticket.", 404);
  }

  const existingAttendances = await Attendance.find({
    registrationId: registration._id,
  });

  const checkedInMemberIdSet = new Set(
    existingAttendances
      .filter((a) => a.teamMemberId)
      .map((a) => a.teamMemberId!.toString())
  );

  const memberRoster = team.members.map((m: any) => {
    const isCheckedIn = checkedInMemberIdSet.has(m._id.toString());
    const attendanceRecord = existingAttendances.find(
      (a) => a.teamMemberId?.toString() === m._id.toString()
    );
    return {
      _id: m._id.toString(),
      name: m.name,
      email: m.email,
      phoneNumber: m.phoneNumber,
      collegeOrOrganization: m.collegeOrOrganization,
      isCheckedIn,
      checkedInAt: attendanceRecord ? attendanceRecord.checkedInAt : null,
    };
  });

  const totalMembers = team.members.length;
  const checkedInCount = memberRoster.filter((m: any) => m.isCheckedIn).length;
  const allAlreadyCheckedIn = checkedInCount >= totalMembers;

  return {
    isTeam: true,
    allAlreadyCheckedIn,
    message: allAlreadyCheckedIn
      ? `All ${totalMembers} members of Team "${team.teamName}" have already checked in.`
      : `Team "${team.teamName}" ticket detected (${checkedInCount}/${totalMembers} checked in).`,
    ticket,
    registrationId: registration._id.toString(),
    team: {
      _id: team._id.toString(),
      teamName: team.teamName,
      teamCode: team.teamCode,
      totalMembers,
      checkedInCount,
      members: memberRoster,
    },
  };
};

/**
 * Checks in selected team members from a team ticket.
 */
export const checkInTeamMembers = async (
  eventId: string,
  registrationId: string,
  memberIds: string[],
  organizerId: string
) => {
  const registration: any = await Registration.findById(registrationId).populate("teamId");
  if (!registration) {
    throw new AppError("Registration record not found.", 404);
  }

  if (registration.eventId.toString() !== eventId) {
    throw new AppError("This ticket belongs to another event.", 400);
  }

  const team: any = registration.teamId;
  if (!team) {
    throw new AppError("Team record not found.", 404);
  }

  const ticket = await Ticket.findOne({ registrationId: registration._id });
  if (!ticket) {
    throw new AppError("Ticket not found.", 404);
  }

  const newlyCheckedIn: string[] = [];

  for (const memberId of memberIds) {
    const member = team.members.find((m: any) => m._id.toString() === memberId);
    if (!member) continue;

    const existing = await Attendance.findOne({
      registrationId: registration._id,
      teamMemberId: member._id,
    });

    if (!existing) {
      await Attendance.create({
        eventId,
        registrationId: registration._id,
        ticketId: ticket._id,
        teamMemberId: member._id,
        checkedInAt: new Date(),
        checkedInBy: organizerId,
      });
      newlyCheckedIn.push(member.name);
    }
  }

  // Mark registration checkedIn as at least one member is present
  registration.checkedIn = true;
  registration.checkedInAt = new Date();
  await registration.save();

  const totalAttended = await Attendance.countDocuments({
    registrationId: registration._id,
  });

  const allCheckedIn = totalAttended >= team.members.length;
  if (allCheckedIn) {
    ticket.status = "used";
    await ticket.save();
  }

  return {
    registrationId: registration._id,
    newlyCheckedIn,
    totalAttended,
    totalMembers: team.members.length,
    allCheckedIn,
    message: `${newlyCheckedIn.length} member(s) checked in successfully!`,
  };
};
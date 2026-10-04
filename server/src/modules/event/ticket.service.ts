import Ticket from "./ticket.model.js";
import Registration from "./registration.model.js";
import Event from "./event.model.js";
import OrganizationMember from "../organization/organizationMember.model.js";
import { AppError } from "../../utils/AppError.js";
import Attendance from "./attendance.model.js";
import Team from "./team.model.js";

export const getTicket=async(registrationId:string,userId:string)=>{

    const  registration=await Registration.findOne({_id:registrationId,participantId:userId})
    .populate("eventId").populate("teamId");


    if(!registration){
        throw new AppError("Registration not found",404)
    }

    const ticket=await Ticket.findOne({registrationId:registration._id})

    if(!ticket){
        throw new AppError("Ticket not found",404);
    }

    return {ticket,registration}


}



export const ticketVerification=async(ticketNumber:string, registrationId:string,  organizerId: string,teamMemberId?: string)=>{


     const registration = await Registration.findById(registrationId);

     if (!registration) {
    throw new AppError("Registration not found", 404);
  }

  const eventId=registration.eventId

  const event=await Event.findById(eventId);
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
    $in: ["owner", "organizer"],
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
    throw new AppError(
      "Ticket is invalid or has already been used",
      400
    );
  }

 if (!registration.teamId) {
    ticket.status = "used";
    await ticket.save();

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
    throw new AppError(
      "Please select the team member who is checking in",
      400
    );
  }

  const team = await Team.findById(registration.teamId);

   if (!team) {
    throw new AppError("Team not found", 404);
  }

  const teamMember = team.members.find(
    (member) => member._id.toString() === teamMemberId
  );

    if (!teamMember) {
    throw new AppError(
      "Team member not found",
      404
    );
  }

  const existingAttendance = await Attendance.findOne({
    registrationId: registration._id,
    teamMemberId: teamMember._id,
  });

  if (existingAttendance) {
    throw new AppError(
      "This team member has already checked in",
      400
    );
  }

    const attendance = await Attendance.create({
    eventId: event._id,
    registrationId: registration._id,
    ticketId: ticket._id,
    teamMemberId: teamMember._id,
    checkedInAt: new Date(),
    checkedInBy: organizerId,
  });

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

}
import Registration from "./registration.model.js";
import Event from "./event.model.js";
import { AppError } from "../../utils/AppError.js";
import Team,{type ITeamMember} from "./team.model.js";
import Ticket from "./ticket.model.js";

interface IndividualRegistrationInput {
    phoneNumber: string;
    collegeOrOrganization?: string;
}

interface CreateRegistrationAfterPaymentInput {
    eventId: string;
    userId: string;
    registrationType: "individual" | "team";

    phoneNumber: string;
    collegeOrOrganization?: string;

    teamName?: string;
    members?: ITeamMember[];
}


interface TeamRegistrationInput {
    teamName: string;
    phoneNumber: string;
    collegeOrOrganization?: string;
    members: ITeamMember[];
}

const generateTicketNumber = () => {
    return `EVT-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;
};


export const getMyRegistration=async(userId:string)=>{
    console.log("REGISTRATION SERVICE USER ID:", userId);

    const registration=await Registration.find({participantId:userId}).populate("eventId")
        .populate("teamId");



       console.log("REGISTRATIONS:", registration);

    return registration
}



export const individualRegistration=async(eventId:string,userId:string,data: IndividualRegistrationInput)=>{

    const isEvent=await Event.findOne({_id:eventId,isDeleted:false});

    if(!isEvent){
        throw new AppError("event is not found",404) 
    };

    if(isEvent.status !=="published"){
        throw new AppError("Event is not available for registration", 400);
    }

    if(isEvent.registrationType !=="individual"){
        throw new AppError(  "This event requires team registration",400)
    }

    const now=new Date();

    if(isEvent.registrationStartDate> now || isEvent.registrationEndDate<now){
        throw new AppError("Registration is not currently open",400)
    }

    const existingRegistration=await Registration.findOne({eventId:eventId,participantId:userId});

    if(existingRegistration){
        throw new AppError("already registerd to this event ",409)
    }

   


   const updateEvent=await Event.findOneAndUpdate({
    _id:eventId,
    isDeleted:false,
    status:"published",
    $expr:{
        $lt:["$registeredParticipants","$maxParticipants"]
    },
   },{$inc:{registeredParticipants:1},},{new:true});

   if(!updateEvent){
    throw new AppError("event is full",409)
   }



    const registration = await Registration.create({
    eventId,
    participantId: userId,
    phoneNumber: data.phoneNumber,
    collegeOrOrganization: data.collegeOrOrganization
});

const ticket = await Ticket.create({
    registrationId: registration._id,
    ticketNumber: generateTicketNumber(),
});

    return {registration,ticket}


}


export const teamRegistration=async(eventId:string,userId:string,data:TeamRegistrationInput)=>{

    const isEvent=await Event.findOne({_id:eventId,isDeleted:false});

    if(!isEvent){
        throw new AppError("event is not found",404);
    }

     if(isEvent.status !=="published"){
        throw new AppError("Event is not available for registration", 400);
    }

    if(isEvent.registrationType !=="team"){
        throw new AppError(  "This event requires individual registration",400)
    }

     const now=new Date();

    if(isEvent.registrationStartDate> now || isEvent.registrationEndDate<now){
        throw new AppError("Registration is not currently open",400)
    }

       if (!isEvent.teamSize) {
        throw new AppError(
            "Team size is not configured for this event",
            400
        );
    }

     const totalMembers = data.members.length + 1;

    if (totalMembers !== isEvent.teamSize) {
        throw new AppError(
            `Team must have exactly ${isEvent.teamSize} members`,
            400
        );
    }

        const leaderRegistration = await Registration.findOne({
        eventId,
        participantId: userId
    });

    if (leaderRegistration) {
        throw new AppError(
            "You are already registered for this event",
            409
        );
    }

    const eventUpdate=await Event.findOneAndUpdate({
        _id:eventId,
        isDeleted:false,
        status:"published",
        $expr:{
            $lt:[
                {$add:["$registeredParticipants",totalMembers]},"$maxParticipants"]
        },
    },
{$inc:{registeredParticipants:totalMembers},},{new:true});

 if(!eventUpdate){
    throw new AppError("evnet is full",409)
 }

      const teamCode =
        `TEAM-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase()}`;

  
     const team = await Team.create({
        eventID: eventId,
        teamName: data.teamName,
        leaderID: userId,
        members:data.members,
        teamCode,
        isDeleted: false
    });



 const registration = await Registration.create({
    eventId,
    participantId: userId,
    teamId: team._id,
    phoneNumber: data.phoneNumber,
    collegeOrOrganization: data.collegeOrOrganization
});


       const ticket = await Ticket.create({
    registrationId: registration._id,
    ticketNumber: generateTicketNumber(),
});

    return {
        team,
        registration,
        ticket
    };



}


export const createRegistrationAfterPayment=async( data: CreateRegistrationAfterPaymentInput)=>{

    if (data.registrationType === "individual") {
        const result = await individualRegistration(
            data.eventId,
            data.userId,
            {
                phoneNumber: data.phoneNumber,
                collegeOrOrganization: data.collegeOrOrganization
            }
        );
          return result;
    }

      if (data.registrationType === "team") {

        if (!data.teamName || !data.members) {
            throw new AppError(
                "Team registration data is missing",
                400
            );
        }

           const result = await teamRegistration(
            data.eventId,
            data.userId,
            {
                teamName: data.teamName,
                phoneNumber: data.phoneNumber,
                collegeOrOrganization: data.collegeOrOrganization,
                members: data.members
            }
        );

        return result;
    }
     throw new AppError(
        "Invalid registration type",
        400
    );
}

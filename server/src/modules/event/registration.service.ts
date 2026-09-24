import Registration from "./registration.model.js";
import Event from "./event.model.js";
import { AppError } from "../../utils/AppError.js";
import Team,{type ITeamMember} from "./team.model.js";

interface IndividualRegistrationInput {
    phoneNumber: string;
    collegeOrOrganization?: string;
}

interface TeamRegistrationInput {
    teamName: string;
    phoneNumber: string;
    collegeOrOrganization?: string;
    members: ITeamMember[];
}


export const getMyRegistration=async(userId:string)=>{
    console.log("REGISTRATION SERVICE USER ID:", userId);

    const registration=await Registration.find({participantId:userId}).populate("eventId")
        .populate("teamId");

    if(!registration){
        throw new AppError("not found registration",404)
    }

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

    const registrationCount=await Registration.countDocuments({eventId:isEvent._id})


    if(registrationCount>=isEvent.maxParticipants){
        throw new AppError("event is full",409)
    }

    const registration = await Registration.create({
    eventId,
    participantId: userId,
    phoneNumber: data.phoneNumber,
    collegeOrOrganization: data.collegeOrOrganization
});

    return registration


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

     const teams = await Team.find({
        eventID: isEvent._id,
        isDeleted: false
    }).select("members");

     const registeredCount = teams.reduce(
        (total, team) => total + team.members.length + 1,
        0
    );



    if (
        registeredCount + totalMembers >
        isEvent.maxParticipants
    ) {
        throw new AppError(
            "Not enough seats available for this team",
            400
        );
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


       

    return {
        team,
        registration
    };



}

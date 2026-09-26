import Ticket from "./ticket.model.js";
import Registration from "./registration.model.js";
import { AppError } from "../../utils/AppError.js";

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



export const ticketVerification=async(ticketNumber:string, registrationId:string,userId:string)=>{

    const ticket=await Ticket.findOne({registrationId});

    if(ticket?.ticketNumber !== ticketNumber){
        throw new AppError ("Ticket is not valid",400)
    }

    if(ticket.status ==="used"){
           throw new AppError("This ticket is used ",400)

    }

     return ticket
}
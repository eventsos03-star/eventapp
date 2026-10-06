import * as ticketService from "./ticket.service.js"
import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/response.js";

export const getMyTicket=asyncHandler(async(req,res)=>{

    const userId=req.user!.id;
    const {registrationId}=req.params;

    const result=await ticketService.getTicket(registrationId,userId);

    return success(res,200,"ticket fetch successfully",result)

});



export const verifieTicket=asyncHandler(async(req ,res)=>{
   const organizerId = req.user!.id;
    const {registrationId}=req.params;
    const { ticketNumber, teamMemberId } = req.body;

    const result = await ticketService.ticketVerification(
    ticketNumber,
    registrationId,
    organizerId,
    teamMemberId
  );
    return success(res,200,"Ticket verified successfully",result)
})
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
    const userId=req.user!.id;
    const {registerationId}=req.params;
    const {ticketNumber}=req.body

    const result=await ticketService.ticketVerification(ticketNumber,registerationId,userId);

    return success(res,200,"ticket confirum ",result)
})
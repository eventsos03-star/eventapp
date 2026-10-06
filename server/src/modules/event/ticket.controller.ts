import * as ticketService from "./ticket.service.js"
import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
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



export const scanTicket = asyncHandler(async (req, res) => {
  const organizerId = req.user!.id;
  const eventId = req.params.id;
  const { ticketNumber } = req.body;

  if (!ticketNumber) {
    throw new AppError("ticketNumber is required", 400);
  }

  const result = await ticketService.scanAndVerifyTicket(
    eventId,
    ticketNumber,
    organizerId
  );

  return success(res, 200, result.message, result);
});

export const checkInTeamMembers = asyncHandler(async (req, res) => {
  const organizerId = req.user!.id;
  const eventId = req.params.id;
  const { registrationId, memberIds } = req.body;

  if (!registrationId || !Array.isArray(memberIds) || memberIds.length === 0) {
    throw new AppError("registrationId and at least one memberId are required", 400);
  }

  const result = await ticketService.checkInTeamMembers(
    eventId,
    registrationId,
    memberIds,
    organizerId
  );

  return success(res, 200, result.message, result);
});
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import * as publicEventService from "./public-event.service.js"
import { success } from "../../utils/response.js";
import { publicEventQueryValidator } from "./event.validator.js";


export const getAllEventsController=asyncHandler(async(req ,res)=>{
    
    const {search,page,limit}=publicEventQueryValidator.parse(req.query);

    const events= await publicEventService.getAllEvents({search,page,limit})

    return success(res,200,"event fatched successfull",events)

})

export const getEventsByIdController=asyncHandler(async(req,res)=>{
    const {id}=req.params;

    const event=await publicEventService.getEventById(id);

    return success(res,200,"event by Id fatched successfull",event);
})
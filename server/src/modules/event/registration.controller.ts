import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/response.js";
import * as registrationService from "./registration.service.js";



export const getAllMyRegistration=asyncHandler(async(req,res)=>{

    
    const userId=req.user!.id;

      console.log("USER ID:", userId);

    const myRegistration=await registrationService.getMyRegistration(userId);

    return success(res,200,"my registration fetched successfully",myRegistration)


})





export const individualRegistration=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    const userId=req.user!.id
    const {phoneNumber,collegeOrOrganization}=req.body;

    const registeration=await registrationService.individualRegistration(id,userId,{phoneNumber,collegeOrOrganization}) ;

    return success(res,201,"registered successfully",registeration)
});


export const teamRegistration=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    const userId=req.user!.id;

    const {teamName,phoneNumber,collegeOrOrganization,members}=req.body;

    const registeration=await registrationService.teamRegistration(id,userId,{teamName,phoneNumber,collegeOrOrganization,members})

    return success(res,201,"team registered successfully",registeration);
})


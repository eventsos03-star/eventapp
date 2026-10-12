import { success } from "../../utils/response.js";
import * as venueOwnerService from "./venueOwner.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";


export const applyVenueOwner = asyncHandler(async (req,res) => {

    const userId = req.user!.id;

    const {ownerName,phone,alternativePhone,email,address,managerName,} = req.body;

    if (!ownerName ||!phone ||!alternativePhone ||!email ||!address ||!managerName) {
     throw new AppError("required all the fields",400)
    }

    const application =await venueOwnerService.createVenueOwnerApplication({userId,
        ownerName,
        phone,
        alternativePhone,
        email,
        address,
        managerName,
      });

    return success(res,201 ,"venue owner register successfull",application)

});


export const getMyVenueOwner =asyncHandler(async (req,res,) => {
  
    const userId = req.user!.id;

    const application =await venueOwnerService.getMyVenueOwnerApplication(userId);

    return success(res,200,"appliction of yours",application)
});
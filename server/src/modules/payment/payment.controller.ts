import * as paymentService from "./payment.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import * as registrationService from "../event/registration.service.js"


export const paymentOrder=asyncHandler(async(req ,res)=>{
    const userId=req.user!.id;
    const {eventId}=req.body;

    const result=await paymentService.createPaymentOrder(eventId,userId);

    return success(res,201,"payment order created successfully",result)

})

export const verifiesEventPayment=asyncHandler(async(req ,res)=>{
    const userId = req.user!.id;

  
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature, eventId,registrationType, phoneNumber,collegeOrOrganization,
         teamName,   members
    }=req.body;
    const result  =await paymentService.verifyEventPayment(razorpay_order_id,razorpay_payment_id,razorpay_signature);

    const payment = result.payment;
      if (payment.payerId.toString() !== userId) {
        throw new AppError("Unauthorized payment", 403);
    }

         if (payment.eventId?.toString() !== eventId) {
        throw new AppError("Payment event mismatch", 400);
    }

    const registrationResult=await registrationService.createRegistrationAfterPayment({eventId,
        userId,
        registrationType,
        phoneNumber,
        collegeOrOrganization,
        teamName,
        members});


        payment.status = "success";
        payment.transactionId = razorpay_payment_id;
        payment.referenceId = registrationResult.registration._id;

await payment.save();

    return success(res,200,"payment verified successfull",{payment, ...registrationResult })
})
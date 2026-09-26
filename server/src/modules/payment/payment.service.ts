import { AppError } from "../../utils/AppError.js";
import Event from "../event/event.model.js";
import razorpay from "../../config/razorpay.js";
import Payment from "./payment.model.js";
import crypto from "crypto"

export const createPaymentOrder=async(eventId:string,userId:string)=>{

    const event=await Event.findOne({_id:eventId,isDeleted:false,status:"published"});

    if (!event) {
    throw new AppError("Event not found", 404);
}   

    if(event.eventType !=="paid"){
        throw new AppError("event is free",400)

}

if (!event.ticketPrice || event.ticketPrice <= 0) {
    throw new AppError("Invalid event ticket price", 400);
}

const participantCount =
    event.registrationType === "team"
        ? event.teamSize ?? 1
        : 1;

const totalAmount = event.ticketPrice * participantCount;

const amount = totalAmount * 100;

const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `event_${eventId}_${Date.now()}`,
    });

      const payment = await Payment.create({
        payerId: userId,
        eventId: event._id,
        paymentType: "Registration",
        referenceType: "Registration",
        totalAmount,
        platformFee: 0,
        receiverAmount: event.ticketPrice,
        orderId:order.id,
        status: "pending",
    });

     return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment._id,
    };



}



export const verifyEventPayment=async(razorpay_order_id:string,razorpay_payment_id:string,razorpay_signature:string)=>{

    const body=razorpay_order_id +"|"+razorpay_payment_id;
     
    const expectedSign=crypto
              .createHmac("sha256",process.env.RAZORPAY_KEY_SECRET!)
              .update(body)
              .digest("hex");
   console.log("expectedSign:",expectedSign);
   console.log("razorpays sign:",razorpay_signature)

              if(expectedSign !==razorpay_signature){
                throw new AppError("Invalid signature",400)
              }

    const payment=await Payment.findOne({orderId:razorpay_order_id});

      if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    if (payment.status === "success") {
        throw new AppError("Payment already verified", 400);
    }

      return {
        payment,
        razorpayPaymentId: razorpay_payment_id,
    };


}

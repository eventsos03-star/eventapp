import { eventApi } from "./eventApi";


export const paymentService={
    createOrder:(eventId:string)=>
        eventApi.post("/events/payment",{eventId})
         .then((res)=>res.data),

           verifyPayment: (data: any) =>
        eventApi
            .post("/events/payment/verify", data)
            .then((res) => res.data),
}
import Event from "./event.model.js";
import { AppError } from "../../utils/AppError.js";
import VenueBooking from "../venue/venueBooking.model.js";

interface PublicEventFilters{
    search?:string;
    page?:number;
    limit?:number;
}


export const getAllEvents=async({search,page,limit}:PublicEventFilters)=>{

    const filter:Record<string, unknown>={
        status:"published",
         isDeleted: false,
     }

     if(search){
        filter.eventName={
            $regex:search,
            $options:"i",
        };
     }

     const currentPage=page || 1;
     const pageLimit= limit  ||10;

     const skip=(currentPage-1) *pageLimit;

     const events=await Event.find(filter)
     .populate("organizationId","organizationName")
     .populate({
      path: "venueBookingId",
      populate: {
        path: "venueId",
        select: "venueName location",
      },
    })
    .skip(skip).limit(pageLimit).sort({createdAt:-1});

     const totalEvents=await Event.countDocuments(filter);

     const totalPages =Math.ceil(totalEvents/pageLimit);

     return{
        events,
        pagination:{
            currentPage,
            pageLimit,
            totalEvents,
            totalPages
        }
     }


}


export const getEventById=async(eventId:string)=>{

    const event=await Event.findOne({_id:eventId,status:"published",isDeleted:false,})
               .populate("organizationId", "organizationName")
                .populate({
      path: "venueBookingId",
      populate: {
        path: "venueId",
        select: "venueName location",
      },
    });
    if(!event){
        throw new AppError("eventby Id not found",404)
    };
     console.log("EVENT:", event);

  const booking = await VenueBooking.findById(event?.venueBookingId);

  console.log("VENUE BOOKING:", booking);


    return event


}
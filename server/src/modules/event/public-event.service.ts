import Event from "./event.model.js";
import { AppError } from "../../utils/AppError.js";
import VenueBooking from "../venue/venueBooking.model.js";
import Venue from "../venue/venue.model.js";
import Registration from "./registration.model.js";

interface PublicEventFilters{
    search?:string;
    location?:string;
   eventType?: "free" | "paid";
  sort?: "upcoming" | "latest" | "price-low" | "price-high";
    page?:number;
    limit?:number;
}


export const getAllEvents=async({search,page,limit,location,eventType,sort,}:PublicEventFilters)=>{

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
     if (eventType) {
  filter.eventType = eventType;
}


     const currentPage=page || 1;
     const pageLimit= limit  ||10;

     const skip=(currentPage-1) *pageLimit;
      let sortQuery: Record<string, 1 | -1> = {
    eventDate: 1,
  };

   if (sort === "latest") {
    sortQuery = {
      createdAt: -1,
    };
  }

   if (sort === "price-low") {
    sortQuery = {
      ticketPrice: 1,
    };
  }

   if (sort === "price-high") {
    sortQuery = {
      ticketPrice: -1,
    };
  }

  if (location) {
  const venues = await Venue.find({
    location: {
      $regex: location,
      $options: "i",
    },
  }).select("_id");

  const venueIds = venues.map((venue) => venue._id);

  const venueBookings = await VenueBooking.find({
    venueId: { $in: venueIds },
  }).select("_id");

  const venueBookingIds = venueBookings.map(
    (booking) => booking._id
  );

  filter.venueBookingId = {
    $in: venueBookingIds,
  };
}

     const events=await Event.find(filter)
     .populate("organizationId","organizationName")
     .populate({
      path: "venueBookingId",
      populate: {
        path: "venueId",
        select: "venueName location",
      },
    })
    .skip(skip).limit(pageLimit).sort(sortQuery);

     const totalEvents=await Event.countDocuments(filter);

     const totalPages =Math.ceil(totalEvents/pageLimit);

     const eventsWithCapacity = await Promise.all(
  events.map(async (event) => {
    const registeredCount = await Registration.countDocuments({
      eventId: event._id,
    });

    const maxParticipants=event.maxParticipants||0

    const availableSeats =
      maxParticipants - registeredCount;

    return {
      ...event.toObject(),
      registeredCount,
      availableSeats: Math.max(availableSeats, 0),
    };
  })
);

     return{
        events:eventsWithCapacity,
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
    


  if (!event) {
    throw new AppError("Event by Id not found", 404);
  }

  const registeredCount = await Registration.countDocuments({
    eventId: event._id,
  });

  const maxParticipants = event.maxParticipants || 0;

  const availableSeats = Math.max(
    maxParticipants - registeredCount,
    0
  );

  const isFull = registeredCount >= maxParticipants;

  return {
    ...event.toObject(),
    registeredCount,
    availableSeats,
    isFull,
  };


}
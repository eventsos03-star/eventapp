import { AppError } from "../../utils/AppError.js";
import Event from "./event.model.js";
import type { CreateEventInput, UpdateEventInput } from "./event.model.js";

export async function createEvent(data: CreateEventInput, userId: string) {
  const event = await Event.create({
    ...data,
    createdBy: userId,
    status: "draft",
  });
  return event;
}

export async function publishEvent(eventId:string) {
    const event = await Event.findById(eventId)
    if(!event){
      throw new AppError("Event not found",404)
    }

    if(event.status==="published"){
        throw new AppError("Event already published",409)
    }
    event.status="published"
    await event.save()

    return event
}

export async function getPublishedLists(){
    const event = await Event.find({status: "published", isDeleted: false}).sort({eventDate : 1})
    return event
}

export async function getalleventsforadmin(){
    const event = await Event.find({ isDeleted: false })
      .sort({ eventDate: 1 })
      .populate("organizationId", "organizationName")
      .populate("createdBy", "firstName lastName email");
    return event;
}



export async function getEventById(eventId : string){
    const event = await Event.findOne({ _id : eventId ,status: "published", isDeleted: false}).sort({eventDate : 1})
    return event
}

export async function deleteEvent(eventId : string){
    const event = await Event.findById( eventId )
     if(!event){
      throw new AppError("Event not found",404)
    }
    event.isDeleted=true
    await event.save()
}

export async function updateEvent(eventId: string, data: UpdateEventInput) {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  Object.assign(event, data);
  await event.save();

  return event;
}
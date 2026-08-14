import { AppError } from "../../utils/AppError.js";
import Event from "./event.model.js";
import type { CreateEventInput } from "./event.model.js";

export async function createEvent(data: CreateEventInput) {
  const event = await Event.create({
    ...data,
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
    const event = await Event.find({status : "published"}).sort({eventDate : 1})
    return event
}
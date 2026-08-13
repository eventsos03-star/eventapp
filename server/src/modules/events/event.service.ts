import { CreateEventInput } from "./event.types.js";
import Event from "./models/event.model.js";

export async function createEvent(data : CreateEventInput) {
    const event = Event.create({
        ...data,
        status: "draft",
    })
    return event
}
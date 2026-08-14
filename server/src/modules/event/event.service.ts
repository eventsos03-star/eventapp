import Event from "./event.model.js";
import type { CreateEventInput } from "./event.model.js";

export async function createEvent(data: CreateEventInput) {
  const event = await Event.create({
    ...data,
    status: "draft",
  });
  return event;
}
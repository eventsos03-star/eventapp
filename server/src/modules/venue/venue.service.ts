import Venue from "./venue.model.js";

export const createVenue = async (data: any) => {
  return await Venue.create(data);
};

export const getVenues = async (city?: string) => {
  const filter: Record<string, unknown> = { status: "approved" };

  if (city) {
    filter["location.city"] = city;
  }

  return await Venue.find(filter);
};

export const getAllVenuesForAdmin = async (city?: string) => {
  const filter: Record<string, unknown> = {};

  if (city) {
    filter["location.city"] = city;
  }

  return await Venue.find(filter);
};

export const getVenueById = async (id: string) => {
  return await Venue.findById(id);
};

export const approveVenue = async (id: string) => {
  return await Venue.findByIdAndUpdate(id, { status: "approved" }, { new: true });
};
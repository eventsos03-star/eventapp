import Venue from "./venue.model.js";

export const createVenue = async (data: any) => {
  return await Venue.create(data);
};

export const getVenues = async (city?: string) => {
  const filter: Record<string, unknown> = {
    status: "approved",
  };

  if (city?.trim()) {
    filter["location.city"] = {
      $regex: city.trim(),
      $options: "i",
    };
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
export const updateVenue = async (
  id: string,
  ownerId: string,
  data: any
) => {
  return await Venue.findOneAndUpdate(
    {
      _id: id,
      ownerId,
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

export const deleteVenue = async (
  id: string,
  userId: string,
  userRole: string
) => {
  // ADMIN can delete any venue
  if (userRole === "ADMIN") {
    return await Venue.findByIdAndDelete(id);
  }

  // Normal user can delete only their own venue
  return await Venue.findOneAndDelete({
    _id: id,
    ownerId: userId,
  });
};
export const rejectVenue = async (id: string) => {
  return await Venue.findByIdAndUpdate(
    id,
    { status: "rejected" },
    { new: true }
  );
};
export const getMyVenues = async (ownerId: string) => {
  return await Venue.find({ ownerId });
};
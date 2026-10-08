import VenueOwner from './venueOwner.mode.js'
import { AppError } from '../../utils/AppError.js';


interface CreateVenueOwnerData {
  userId: string;
  ownerName: string;
  phone: string;
  alternativePhone: string;
  email: string;
  address: string;
  managerName: string;
}



export const createVenueOwnerApplication = async (
  data: CreateVenueOwnerData,
) => {
  const existingApplication = await VenueOwner.findOne({
    userId: data.userId,
  });

  if (existingApplication) {
    throw new AppError(
      'You have already submitted a venue owner application',400);
  }

  const venueOwner = await VenueOwner.create({
    userId: data.userId,
    ownerName: data.ownerName,
    phone: data.phone,
    alternativePhone: data.alternativePhone,
    email: data.email,
    address: data.address,
    managerName: data.managerName,
    status: 'pending',
  });

  return venueOwner;
};

export const getMyVenueOwnerApplication = async (
  userId: string,
) => {
  const venueOwner = await VenueOwner.findOne({
    userId,
  }).populate('userId', 'name email');

  if (!venueOwner) {
    throw new AppError(
      'Venue owner application not found',404
    );
  }

  return venueOwner;
};
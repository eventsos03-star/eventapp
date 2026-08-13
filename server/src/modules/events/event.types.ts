import mongoose ,{type Types} from "mongoose";
export interface IBannerImage{
    url:string;
    publicId:string;
}
export interface IEvent{
    organizationId:Types.ObjectId;
    venueBookingId?:Types.ObjectId;
    eventName:string;
    description:string;
    bannerImage?:IBannerImage;
    eventType: 'free' | 'paid';
    registrationType: 'team' | 'individual';
    maxParticipants:number;
    registrationStartDate:Date;
    registrationEndDate:Date;
    eventDate:Date;
    certificateEnabled:boolean;
    status:'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
    ticketPrice?:number;
    teamSize?: number;
    createdAt:Date;
    updatedAt:Date;
}

export type CreateEventInput = Omit<
  IEvent,
  'status' | 'createdAt' | 'updatedAt' | 'organizationId' | 'venueBookingId'
> & {
  organizationId: string;
  venueBookingId?: string;
};
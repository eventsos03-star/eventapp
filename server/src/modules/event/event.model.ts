import mongoose, { Schema, type Types } from "mongoose";


export interface IBannerImage {
    url: string;
    publicId: string;
}

export interface IEvent {
    organizationId: Types.ObjectId;
    venueBookingId?: Types.ObjectId;
    eventName: string;
    description: string;
    bannerImage: IBannerImage;
    eventType: 'free' | 'paid';
    registrationType: 'team' | 'individual';
    maxParticipants: number;
    registrationStartDate: Date;
    registrationEndDate: Date;
    eventDate: Date;
    certificateEnabled: boolean;
    status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
    ticketPrice?: number;
    teamSize?: number;
    createdAt: Date;
    updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    venueBookingId: { type: Schema.Types.ObjectId, ref: 'VenueBooking' },
    eventName: { type: String, required: true },
    description: { type: String, required: true },
    bannerImage: {
        url: { type: String },
        publicId: { type: String }
    },
    eventType: { type: String, enum: ['free', 'paid'] },
    registrationType: { type: String, enum: ['team', 'individual'] },
    maxParticipants: { type: Number, required: true },
    registrationStartDate: { type: Date, required: true },
    registrationEndDate: { type: Date, required: true },
    eventDate: { type: Date, required: true },
    certificateEnabled: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'], default: 'draft' },
    ticketPrice: { type: Number },
    teamSize: { type: Number },


}, { timestamps: true });


const Event = mongoose.models.Event as mongoose.Model<IEvent>
    ?? mongoose.model<IEvent>('Event', eventSchema);

export default Event;

export type CreateEventInput = Omit<IEvent,
 'status' | 'createdAt' | 'updatedAt' | 'organizationId' | 'venueBookingId'> 
 & { organizationId: string; venueBookingId?: string; };

 
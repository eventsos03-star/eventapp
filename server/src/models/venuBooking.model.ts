import mongoose,{Schema,type Types} from "mongoose";

export interface IVenueBooking{
    organizationId:Types.ObjectId;
    venueId:Types.ObjectId;
    requestedBy:Types.ObjectId;
    bookingDate:Date;
    bookingAmount :number
    status : 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    paymentStatus: 'pending'  | 'advancePaid' | 'fullyPaid';
    createdAt:Date;
    updatedAt:Date;
}

const venueBookingSchema=new Schema<IVenueBooking>({
    organizationId:{type:Schema.Types.ObjectId,ref:'Organization',required:true},
    venueId:{type:Schema.Types.ObjectId,ref:'Venue',required:true},
    requestedBy:{type:Schema.Types.ObjectId,ref:'User',required:true},
    bookingDate:{type:Date,required:true},
    bookingAmount:{type:Number,required:true},
    status :{ type:String,enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],default:'pending',required:true},
paymentStatus: {type:String,enum : ['pending' ,'advancePaid' ,'fullyPaid'],default:'pending'},


},{timestamps:true});


const VenueBooking=mongoose.model<IVenueBooking>('VenueBooking',venueBookingSchema);

export default VenueBooking;
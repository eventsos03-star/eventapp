import mongoose , {Schema ,type  Types} from "mongoose";


export interface IVenueImage{
    url:string;
    publicId:string;
}

export interface IVenue{
    ownerId:Types.ObjectId;
    venueName:string;
    description:string;
    images:IVenueImage[];
    location:{address:string;city:string;state:string};
    capacity:number;
    pricePerDay:number;
    bookingPaymentPolicy: 'fullpayment' | 'advanceAllowed' |'payAfterEvent' ;
    advancePercentage?:number;
    status:'pending'|'approved'| 'rejected' | 'blocked';
    isDeleted:boolean;
    createdAt:Date;
    updatedAt:Date;

}


const venueSchema=new Schema<IVenue>({
    ownerId:{type:Schema.Types.ObjectId,ref:'User',required:true},
    venueName:{type:String,required:true},
    description:{type:String,required:true},
    images:[
        {
            url:{
                type:String,
                required:true
            },
            publicId:{
                type:String,
                required:true,
            },
        },
    ],
    location:{
        address:{type:String,required:true},
        city:{type:String,required:true},
        state:{type:String,required:true},
    },
    capacity:{type:Number,required:true},
    pricePerDay:{type:Number,required:true},
    bookingPaymentPolicy:{type:String,enum:['fullpayment' ,'advanceAllowed' ,'payAfterEvent' ],required:true},
    advancePercentage:{type:Number},
    status:{type:String,enum:['pending','approved','rejected','blocked'],default:'pending',required:true},
    isDeleted:{type:Boolean,default:false}

},{timestamps:true});

const Venue=mongoose.model<IVenue>('Venue',venueSchema);

export default Venue;
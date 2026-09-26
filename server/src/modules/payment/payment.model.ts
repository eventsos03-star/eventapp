import mongoose,{Schema,type Types} from "mongoose";


export interface IPayment{
    payerId:Types.ObjectId;
    referenceId?:Types.ObjectId;
    eventId?: Types.ObjectId;
    referenceType :'Registration' | 'VenueBooking'  ;
    paymentType   : 'Registration' | 'Advance' | 'Final';
    totalAmount:number;
    platformFee :number;
    receiverAmount :number;
    orderId:string;
    transactionId?:string;
    status : 'pending' | 'success' |'failed';
    createdAt:Date;
    updatedAt:Date;
}


const paymentSchema=new Schema<IPayment>({
     payerId:{type:Schema.Types.ObjectId,ref:'User',required:true},
    referenceId:{type:Schema.Types.ObjectId ,refPath:'referenceType'},
    eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
},
    referenceType :{type:String,enum:['Registration' , 'VenueBooking'],required:true},
    paymentType   : {type:String,enum:['Registration' , 'Advance' , 'Final']},
    totalAmount:{type:Number},
    platformFee :{type:Number},
    receiverAmount :{type:Number},
    orderId:{type:String},
    transactionId:{type:String},
    status : {type:String,enum:['pending' , 'success' ,'failed']}


},{timestamps:true});

const Payment=mongoose.model<IPayment>('Payment',paymentSchema);

export default Payment;
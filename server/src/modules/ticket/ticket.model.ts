import mongoose,{Schema,type Types} from "mongoose";


export interface ITicket{
    registrationId:Types.ObjectId;
    ticketNumber:string;
    status: 'active' | 'used';
    createdAt:Date;
    updatedAt:Date;
}

const ticketSchema=new Schema<ITicket>({
    registrationId:{type:Schema.Types.ObjectId,ref:'Registration',required:true},
    ticketNumber:{type:String,required:true,unique:true},
    status:{type:String,enum:['active','used'],default:'active',required:true},
    

},{timestamps:true});

const Ticket=mongoose.model<ITicket>("Ticket",ticketSchema);

export default Ticket;
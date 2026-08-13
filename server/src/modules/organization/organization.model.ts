import mongoose,{Schema, type Types} from "mongoose";

export interface IOrganization{
    organizationName:string;
    description:string;
    logo?:string;
    email:string;
    phoneNumber?:string;
    address:string;
    ownerId:Types.ObjectId;
    status:'pending' | 'approved' | 'rejected' | 'blocked';
    createdAt:Date;
    updatedAt:Date;


}


const organizationSchema=new Schema<IOrganization>(
    {
        organizationName:{
            type:String,
            required:true,

        },
        description:{type:String},
        logo:{type:String},
        email:{type:String,required:true},
        phoneNumber:{type:String},
        address:{type:String,required:true},
        ownerId:{type:Schema.Types.ObjectId,ref:'User',required:true},
        status:{type:String,enum:['pending', 'approved', 'rejected', 'blocked'],default:'pending'},
  },{timestamps:true}
);

const Organization=mongoose.model<IOrganization>('Organization',organizationSchema);

export default Organization;




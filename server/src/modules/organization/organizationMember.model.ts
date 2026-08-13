import mongoose,{Schema, type Types} from "mongoose";

export interface IOrganizationMember{
    organizationId:Types.ObjectId;
    userId:Types.ObjectId;
    inviteEmail?:string;
    role:'owner'  | 'manager' | 'member';
    inviteStatus: 'pending' | 'accepted'| 'rejected';
    invitedBy:Types.ObjectId;
    createdAt:Date;
    updatedAt:Date;

}


const organizationMemberSchema=new Schema<IOrganizationMember>({
    organizationId:{type:Schema.Types.ObjectId ,ref:'Organization',required:true},
    userId:{type:Schema.Types.ObjectId,ref:'User',required:true},
    inviteEmail:{type:String,},
    role:{type:String,enum:["owner", 'manager', 'member'],required:true},
    inviteStatus:{type:String,enum:['pending' ,'accepted' ,'rejected'],default:'pending'},
    invitedBy:{type:Schema.Types.ObjectId,ref:'User'},

},{timestamps:true}

)

const OrganizationMember=mongoose.model<IOrganizationMember>('OrganizationMember',organizationMemberSchema);

export default OrganizationMember;
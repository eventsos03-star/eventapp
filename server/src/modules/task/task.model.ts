import mongoose,{Schema,type Types} from "mongoose";

export interface ITask{
    eventId:Types.ObjectId;
    title :string;
    description?:string;
    assignedMemberId:Types.ObjectId;
    createdByMemberId:Types.ObjectId;
    priority :'low' | 'medium'  | 'high';
    status : 'Todo'| 'InProgress' | 'Done';
    dueDate:Date;
    createdAt :Date;
    updatedAt:Date;
}

const taskSchema =new Schema<ITask>({
    eventId:{type:Schema.Types.ObjectId,ref:'Event',required:true},
    title:{type:String,required:true},
    description:{type:String},
    assignedMemberId:{type:Schema.Types.ObjectId,ref:'UsOrganizationMemberer',required:true},
    createdByMemberId:{type:Schema.Types.ObjectId,ref:'OrganizationMember',required:true},
    priority:{type:String,enum:['low' , 'medium' , 'high'],required:true},
    status:{type:String,enum:['Todo' , 'InProgress' , 'Done'],default:'Todo',required:true},
    dueDate:{type:Date,required:true}


},{timestamps:true});

const Task=mongoose.model<ITask>('Task',taskSchema);

export default Task;
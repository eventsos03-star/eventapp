import mongoose,{Schema,type Types} from "mongoose";

export interface ITeam{
    eventID:Types.ObjectId;
    teamName:string;
    leaderID:Types.ObjectId;
    teamCode:string;
    isDeleted:boolean;
    createdAt:Date;
    updatedAt:Date;
}


const teamSchema=new Schema<ITeam>({
    eventID:{type:Schema.Types.ObjectId,ref:'Event',required:true},
    teamName:{type:String,required:true},
    leaderID:{type:Schema.Types.ObjectId,ref:'User',required:true},
    teamCode:{type:String,unique:true,required:true},
    isDeleted:{type:Boolean,default:false}
    
},{timestamps:true});

const Team=mongoose.model('Team',teamSchema);

export default Team;


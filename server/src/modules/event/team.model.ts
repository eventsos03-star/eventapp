import mongoose,{Schema,type Types} from "mongoose";

export interface ITeam{
    eventID:Types.ObjectId;
    teamName:string;
    leaderID:Types.ObjectId;
    members: ITeamMember[];
    teamCode:string;
    isDeleted:boolean;
    createdAt:Date;
    updatedAt:Date;
}

export interface ITeamMember {
     _id: Types.ObjectId;
    name: string;
    email: string;
    phoneNumber?: string;
    collegeOrOrganization?: string;
}


const teamSchema=new Schema<ITeam>({
    eventID:{type:Schema.Types.ObjectId,ref:'Event',required:true},
    teamName:{type:String,required:true},
    leaderID:{type:Schema.Types.ObjectId,ref:'User',required:true},
    members: [
        {
            name: {
                type: String,
                required: true,
                trim: true
            },

            email: {
                type: String,
                required: true,
                trim: true,
                lowercase: true
            },

            phoneNumber: {
                type: String
            },

            collegeOrOrganization: {
                type: String
            }
        }
    ],
    teamCode:{type:String,unique:true,required:true},
    isDeleted:{type:Boolean,default:false}
    
},{timestamps:true});

const Team=mongoose.model('Team',teamSchema);

export default Team;


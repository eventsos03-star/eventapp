import bcrypt from 'bcrypt';
import mongoose, { type HydratedDocument, type Model, Schema } from 'mongoose';
import { USER_PROVIDER, USER_ROLE, USER_STATUS, VENUE_OWNER_STATUS } from '../../constants/index.js';
import type { UserProvider, UserRole, UserStatus, VenueOwnerStatus } from '../../types/index.js';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  provider: UserProvider;
  googleId?: string;
  avatar?: string;
  emailVerified: boolean;
  status: UserStatus;
  role: UserRole;
  venueOwnerStatus?: VenueOwnerStatus;
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isDeleted:boolean;
 
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  provider: UserProvider;
  googleId?: string;
  avatar?: string;
  emailVerified: boolean;
  status: UserStatus;
  role: UserRole;
  venueOwnerStatus?: VenueOwnerStatus;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(): SafeUser;
}

type UserModel = Model<IUser, {}, UserMethods>;

export type UserDoc = HydratedDocument<IUser, UserMethods>;

const userSchema = new Schema<IUser, UserModel, UserMethods>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, select: false },
    provider: { type: String, enum: Object.values(USER_PROVIDER), default: USER_PROVIDER.LOCAL },
    googleId: { type: String },
    avatar: { type: String },
    emailVerified: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.PENDING },
    role: { type: String, enum: Object.values(USER_ROLE), default: USER_ROLE.USER },
    venueOwnerStatus: { type: String, enum: Object.values(VENUE_OWNER_STATUS) },
    verificationToken: { type: String },
    verificationExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isDeleted:{type:Boolean,default:false},
    // Soft delete ready: set this to a date instead of removing the document.
  
  },
  { timestamps: true },
);

userSchema.index({ status: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });


userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function (): SafeUser {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    provider: this.provider,
    googleId: this.googleId || undefined,
    avatar: this.avatar || undefined,
    emailVerified: this.emailVerified,
    status: this.status,
    role: this.role,
    venueOwnerStatus: this.venueOwnerStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;

import mongoose, { Document, Schema } from "mongoose";

export interface IAttendance extends Document {
  eventId: mongoose.Types.ObjectId;
  registrationId: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
   teamMemberId?: mongoose.Types.ObjectId;

  checkedInAt: Date;
  checkedInBy: mongoose.Types.ObjectId;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    registrationId: {
      type: Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
    },

    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",

    },

    teamMemberId: {
  type: Schema.Types.ObjectId,
},

  

    checkedInAt: {
      type: Date,
      default: Date.now,
    },

    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Attendance=mongoose.model<IAttendance>("Attendance",attendanceSchema);

export default Attendance;
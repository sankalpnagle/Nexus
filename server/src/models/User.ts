import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "../types/index.js";

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: "" },
    coverPhoto: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 500 },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    birthday: { type: Date },
    occupation: { type: String, default: "" },
    education: { type: String, default: "" },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [
      {
        from: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    sentFriendRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
    groups: [{ type: Schema.Types.ObjectId, ref: "Group" }],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Row Level Security: password never returned by default
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (pw: string) {
  return bcrypt.compare(pw, this.password);
};

// Indexes for RLS-style queries
UserSchema.index({ friends: 1 });
UserSchema.index({ "friendRequests.from": 1 });

export default mongoose.model<IUser>("User", UserSchema);

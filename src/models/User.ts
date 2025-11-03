import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type UserRole = "customer" | "restaurant" | "rider" | "admin";

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  phone: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  avatar_public_id?: string;
  created_at: Date;
  updated_at: Date;
  generateAuthToken: () => Promise<string>;
}

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (v: string) {
        // Require international format for Uganda: +256 followed by 9 digits (drop the leading 0)
        return /^\+256\d{9}$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid Uganda phone number. Use +256XXXXXXXXX format.`
    }
  },
  avatar_url: {
    type: String,
  },
  avatar_public_id: {
    type: String,
  },
  role: {
    type: String,
    enum: ["customer", "restaurant", "rider", "admin"],
    default: "customer",
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre<IUser>("save", async function (this: IUser, next: any) {
  // `this` is the document being saved and is typed as IUser
  const user = this;

  // Normalize phone if it's been modified: accept local (0XXXXXXXXX) and convert to +256XXXXXXXXX
  try {
    if (user.isModified && user.isModified("phone") && user.phone) {
      let p = (user.phone as string).toString();
      // remove spaces and dashes
      p = p.replace(/[\s-]/g, '');
      const localRegex = /^0\d{9}$/;
      const intlRegex = /^\+256\d{9}$/;
      if (localRegex.test(p)) {
        p = '+256' + p.slice(1);
      }
      // if it already matches intlRegex, keep it; otherwise leave and let mongoose validation fail
      user.phone = p;
    }

    if (user.isModified && user.isModified("password")) {
      user.password = await bcrypt.hash(user.password, 8);
    }
  } catch (err) {
    return next(err);
  }

  next();
});

// Generate JWT token
userSchema.methods.generateAuthToken = async function (this: IUser) {
  const user = this;
  return jwt.sign(
    { _id: (user._id as any).toString() },
    process.env.JWT_SECRET!
  );
};

// Hide sensitive info when converting to JSON
userSchema.methods.toJSON = function (this: IUser) {
  const userObj = this.toObject();
  delete (userObj as any).password;
  return userObj;
};

export const User = mongoose.model<IUser>("User", userSchema);

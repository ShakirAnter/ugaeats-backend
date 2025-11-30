import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type UserRole = "customer" | "restaurant" | "rider" | "admin";

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  label?: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at?: Date;
}

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  phone: string;
  phoneVerificationCode?: string | null;
  phoneVerificationExpiry?: Date | null;
  full_name: string;
  role: UserRole;
  suspended?: boolean;
  avatar_url?: string;
  avatar_public_id?: string;
  addresses?: IAddress[];
  favorite_restaurants?: string[];
  favorite_dishes?: string[];
  created_at: Date;
  updated_at: Date;
  preferred_theme?: 'light' | 'dark' | 'system' | null;
  generateAuthToken: () => Promise<string>;
  comparePassword: (enteredPassword: string) => Promise<boolean>;
}

const addressSchema = new mongoose.Schema({
  label: { type: String }, // e.g. "Home", "Work"
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
});

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
      message: (props: any) =>
        `${props.value} is not a valid Uganda phone number. Use +256XXXXXXXXX format.`,
    },
  },
  phoneVerificationCode: { type: String, default: null },
  phoneVerificationExpiry: { type: Date, default: null },
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
  suspended: {
    type: Boolean,
    default: false
  },
  addresses: [addressSchema],
  favorite_restaurants: {
    type: [String],
    default: [],
  },
  favorite_dishes: {
    type: [String],
    default: [],
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
  preferred_theme: { type: String, enum: ['light', 'dark', 'system'], default: null },
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
      p = p.replace(/[\s-]/g, "");
      const localRegex = /^0\d{9}$/;
      const intlRegex = /^\+256\d{9}$/;
      if (localRegex.test(p)) {
        p = "+256" + p.slice(1);
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

// Compare input password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

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

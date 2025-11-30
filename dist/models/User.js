"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const addressSchema = new mongoose_1.default.Schema({
    label: { type: String }, // e.g. "Home", "Work"
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
});
const userSchema = new mongoose_1.default.Schema({
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
            validator: function (v) {
                // Require international format for Uganda: +256 followed by 9 digits (drop the leading 0)
                return /^\+256\d{9}$/.test(v);
            },
            message: (props) => `${props.value} is not a valid Uganda phone number. Use +256XXXXXXXXX format.`,
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
userSchema.pre("save", async function (next) {
    // `this` is the document being saved and is typed as IUser
    const user = this;
    // Normalize phone if it's been modified: accept local (0XXXXXXXXX) and convert to +256XXXXXXXXX
    try {
        if (user.isModified && user.isModified("phone") && user.phone) {
            let p = user.phone.toString();
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
            user.password = await bcryptjs_1.default.hash(user.password, 8);
        }
    }
    catch (err) {
        return next(err);
    }
    next();
});
// Compare input password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcryptjs_1.default.compare(enteredPassword, this.password);
};
// Generate JWT token
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    return jsonwebtoken_1.default.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
};
// Hide sensitive info when converting to JSON
userSchema.methods.toJSON = function () {
    const userObj = this.toObject();
    delete userObj.password;
    return userObj;
};
exports.User = mongoose_1.default.model("User", userSchema);

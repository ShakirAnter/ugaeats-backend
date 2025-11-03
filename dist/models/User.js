"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
            message: (props) => `${props.value} is not a valid Uganda phone number. Use +256XXXXXXXXX format.`
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
userSchema.pre("save", async function (next) {
    // `this` is the document being saved and is typed as IUser
    const user = this;
    if (user.isModified && user.isModified("password")) {
        user.password = await bcryptjs_1.default.hash(user.password, 8);
    }
    next();
});
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

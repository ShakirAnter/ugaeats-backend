"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Restaurant = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const restaurantSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    image_url: {
        type: String
    },
    image_public_id: {
        type: String
    },
    address: {
        type: String,
        required: true
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    phone: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    total_reviews: {
        type: Number,
        default: 0
    },
    delivery_fee: {
        type: Number,
        required: true
    },
    estimated_delivery_time: {
        type: Number,
        required: true
    },
    is_open: {
        type: Boolean,
        default: true
    },
    is_approved: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["pending", "active", "suspended"],
        default: "pending"
    },
    commission_rate: {
        type: Number,
        required: true
    },
    owner_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});
exports.Restaurant = mongoose_1.default.model('Restaurant', restaurantSchema);

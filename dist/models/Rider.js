"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rider = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const riderSchema = new mongoose_1.default.Schema({
    user_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicle_type: {
        type: String,
        enum: ['motorcycle', 'bicycle', 'car'],
        required: true
    },
    vehicle_number: {
        type: String
    },
    is_available: {
        type: Boolean,
        default: true
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    current_latitude: {
        type: Number
    },
    current_longitude: {
        type: Number
    },
    total_deliveries: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
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
exports.Rider = mongoose_1.default.model('Rider', riderSchema);

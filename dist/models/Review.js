"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const reviewSchema = new mongoose_1.default.Schema({
    order_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customer_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    rider_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Rider'
    },
    restaurant_rating: {
        type: Number
    },
    rider_rating: {
        type: Number
    },
    restaurant_comment: {
        type: String
    },
    rider_comment: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});
exports.Review = mongoose_1.default.model('Review', reviewSchema);

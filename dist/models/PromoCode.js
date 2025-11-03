"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoCode = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const promoCodeSchema = new mongoose_1.default.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discount_type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discount_value: {
        type: Number,
        required: true
    },
    min_order_amount: {
        type: Number,
        required: true
    },
    max_discount: {
        type: Number
    },
    valid_from: {
        type: Date,
        required: true
    },
    valid_until: {
        type: Date,
        required: true
    },
    usage_limit: {
        type: Number
    },
    usage_count: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});
exports.PromoCode = mongoose_1.default.model('PromoCode', promoCodeSchema);

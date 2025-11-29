"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = void 0;
// models/Cart.ts
const mongoose_1 = __importDefault(require("mongoose"));
const cartItemSchema = new mongoose_1.default.Schema({
    menu_item_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "MenuItem",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
    specialInstructions: {
        type: String
    },
    price: {
        type: Number,
        required: true,
    },
    subtotal: {
        type: Number,
        required: true,
    },
});
const cartSchema = new mongoose_1.default.Schema({
    user_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    restaurant_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },
    items: [cartItemSchema],
    total: {
        type: Number,
        required: true,
        default: 0,
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
exports.Cart = mongoose_1.default.model("Cart", cartSchema);

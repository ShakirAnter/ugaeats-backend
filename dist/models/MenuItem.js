"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItem = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const menuItemSchema = new mongoose_1.default.Schema({
    restaurant_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },
    category_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "MenuCategory",
    },
    food_type_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "FoodType",
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image_url: {
        type: String,
    },
    image_public_id: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    is_available: {
        type: Boolean,
        required: true,
        default: true,
    },
    preparation_time: {
        type: Number,
        required: true,
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
exports.MenuItem = mongoose_1.default.model("MenuItem", menuItemSchema);

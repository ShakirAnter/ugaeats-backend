"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const menuCategorySchema = new mongoose_1.default.Schema({
    restaurant_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    sort_order: {
        type: Number,
        default: 999,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});
exports.MenuCategory = mongoose_1.default.model("MenuCategory", menuCategorySchema);

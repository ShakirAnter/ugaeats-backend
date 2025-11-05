"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const foodTypeSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});
exports.FoodType = mongoose_1.default.model("FoodType", foodTypeSchema);
// Add an icon to each FoodType in the future if needed

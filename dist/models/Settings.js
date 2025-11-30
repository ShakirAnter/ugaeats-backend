"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const settingsSchema = new mongoose_1.default.Schema({
    key: { type: String, default: "global", unique: true },
    ui: {
        theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
        mapTile: { type: String, enum: ["streets", "satellite"], default: "streets" },
        showLabels: { type: Boolean, default: true },
    },
    notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        events: {
            order_new: { type: Boolean, default: true },
            order_update: { type: Boolean, default: true },
        }
    },
    system: {
        maintenanceMode: { type: Boolean, default: false },
        maintenanceMessage: { type: String, default: "" },
    },
    delivery: {
        autoAssignRadiusKm: { type: Number, default: 7 },
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});
settingsSchema.pre("save", function (next) {
    this.updated_at = new Date();
    next();
});
exports.Settings = mongoose_1.default.model("Settings", settingsSchema);

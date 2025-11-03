"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItem = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const orderItemSchema = new mongoose_1.default.Schema({
    order_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    menu_item_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'MenuItem'
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    item_name: {
        type: String,
        required: true
    },
    special_instructions: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});
exports.OrderItem = mongoose_1.default.model('OrderItem', orderItemSchema);

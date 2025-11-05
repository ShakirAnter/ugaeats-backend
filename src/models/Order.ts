import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menu_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
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

const orderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true,
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  rider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rider",
  },

  // ✅ Add items directly into the order
  items: [orderItemSchema],

  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "picked_up",
      "on_the_way",
      "delivered",
      "cancelled",
    ],
    default: "pending",
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  delivery_fee: {
    type: Number,
    required: true,
  },
  total_amount: {
    type: Number,
    required: true,
  },
  payment_method: {
    type: String,
    enum: ["cash", "mtn_momo"],
    required: true,
  },
  payment_status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
    required: true,
  },
  delivery_address: {
    type: String,
    required: true,
  },
  delivery_latitude: Number,
  delivery_longitude: Number,
  customer_phone: {
    type: String,
    required: true,
  },
  notes: String,
  estimated_delivery_time: String,

  accepted_at: Date,
  ready_at: Date,
  picked_up_at: Date,
  delivered_at: Date,
  cancelled_at: Date,
  cancellation_reason: String,

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update updated_at
orderSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export const Order = mongoose.model("Order", orderSchema);

import mongoose from "mongoose";

const menuCategorySchema = new mongoose.Schema({
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
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

export const MenuCategory = mongoose.model("MenuCategory", menuCategorySchema);

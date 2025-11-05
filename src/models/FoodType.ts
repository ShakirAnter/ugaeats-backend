import mongoose from "mongoose";

const foodTypeSchema = new mongoose.Schema({
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

export const FoodType = mongoose.model("FoodType", foodTypeSchema);


// Add an icon to each FoodType in the future if needed
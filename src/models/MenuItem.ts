import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuCategory'
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  image_url: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  is_available: {
    type: Boolean,
    required: true,
    default: true
  },
  preparation_time: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
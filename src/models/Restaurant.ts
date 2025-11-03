import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
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
  image_public_id: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  phone: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  total_reviews: {
    type: Number,
    default: 0
  },
  delivery_fee: {
    type: Number,
    required: true
  },
  estimated_delivery_time: {
    type: Number,
    required: true
  },
  is_open: {
    type: Boolean,
    default: true
  },
  is_approved: {
    type: Boolean,
    default: false
  },
  commission_rate: {
    type: Number,
    required: true
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
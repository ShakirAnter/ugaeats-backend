import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle_type: {
    type: String,
    enum: ['motorcycle', 'bicycle', 'car'],
    required: true
  },
  vehicle_number: {
    type: String
  },
  is_available: {
    type: Boolean,
    default: true
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  current_latitude: {
    type: Number
  },
  current_longitude: {
    type: Number
  },
  total_deliveries: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
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

export const Rider = mongoose.model('Rider', riderSchema);

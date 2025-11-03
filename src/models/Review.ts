import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  rider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rider'
  },
  restaurant_rating: {
    type: Number
  },
  rider_rating: {
    type: Number
  },
  restaurant_comment: {
    type: String
  },
  rider_comment: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

export const Review = mongoose.model('Review', reviewSchema);

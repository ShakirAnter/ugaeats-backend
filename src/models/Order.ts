import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true
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
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
    required: true,
    default: 'pending'
  },
  subtotal: {
    type: Number,
    required: true
  },
  delivery_fee: {
    type: Number,
    required: true
  },
  total_amount: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    enum: ['cash', 'mtn_momo'],
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    required: true
  },
  delivery_address: {
    type: String,
    required: true
  },
  delivery_latitude: {
    type: Number
  },
  delivery_longitude: {
    type: Number
  },
  customer_phone: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  estimated_delivery_time: {
    type: String
  },
  accepted_at: {
    type: Date
  },
  ready_at: {
    type: Date
  },
  picked_up_at: {
    type: Date
  },
  delivered_at: {
    type: Date
  },
  cancelled_at: {
    type: Date
  },
  cancellation_reason: {
    type: String
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

export const Order = mongoose.model('Order', orderSchema);
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  menu_item_id: {
    type: mongoose.Schema.Types.ObjectId,
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

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);

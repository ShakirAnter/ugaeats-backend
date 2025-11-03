import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  menu_item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  special_instructions: {
    type: String
  }
});

export const CartItem = mongoose.model('CartItem', cartItemSchema);

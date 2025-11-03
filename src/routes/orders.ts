import express from 'express';
import { auth } from '../middleware/auth';
import { Order } from '../models/Order';
import { Restaurant } from '../models/Restaurant';

const router = express.Router();

// Create a new order
router.post('/', auth, async (req: any, res) => {
  try {
    const order = new Order({
      ...req.body,
      customer_id: req.user._id,
      status: 'pending'
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: 'Error creating order' });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req: any, res) => {
  try {
    const orders = await Order.find({ customer_id: req.user._id })
      .populate('restaurant_id')
      .sort({ created_at: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Get restaurant's orders
router.get('/restaurant-orders', auth, async (req: any, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner_id: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const orders = await Order.find({ restaurant_id: restaurant._id })
  .populate('customer_id', 'full_name')
      .populate('rider_id', 'full_name')
      .sort({ created_at: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Get rider's orders
router.get('/rider-orders', auth, async (req: any, res) => {
  try {
    const orders = await Order.find({ 
      rider_id: req.user._id,
      status: { $in: ['picked_up', 'delivered'] }
    })
      .populate('restaurant_id')
  .populate('customer_id', 'full_name')
      .sort({ created_at: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Update order status
router.patch('/:id/status', auth, async (req: any, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify permission based on role and status
    const ord: any = order;
    if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner_id: req.user._id });
      if (!restaurant || ord.restaurant_id.toString() !== restaurant._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (!['preparing', 'ready'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status for restaurant' });
      }
    } else if (req.user.role === 'rider') {
      if (ord.rider_id && ord.rider_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (!['picked_up', 'delivered'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status for rider' });
      }
      if (status === 'picked_up' && !ord.rider_id) {
        ord.rider_id = req.user._id;
      }
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    ord.status = status;
    await ord.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: 'Error updating order' });
  }
});

// Get a specific order
router.get('/:id', auth, async (req: any, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant_id')
  .populate('customer_id', 'full_name')
      .populate('rider_id', 'full_name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permission
    const ord: any = order;
    if (
      req.user.role !== 'admin' &&
      ord.customer_id.toString() !== req.user._id.toString() &&
      (ord.rider_id?.toString() !== req.user._id.toString()) &&
      !(await Restaurant.findOne({ owner_id: req.user._id, _id: ord.restaurant_id }))
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order' });
  }
});

export default router;
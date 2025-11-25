import express from "express";
import { auth } from "../middleware/auth";
import { Restaurant } from "../models/Restaurant";
import { User } from "../models/User";
import { MenuItem } from "../models/MenuItem";
import { Order } from "../models/Order";
import { Rider } from "../models/Rider";

const router = express.Router();

// Middleware: only admin
const onlyAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Get all restaurants (with optional status filter)
router.get("/restaurants", auth, onlyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const q: any = {};
    if (status) q.status = status;
    const restaurants = await Restaurant.find(q).populate("owner_id", "full_name email phone role");
    res.json(restaurants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve a restaurant
router.put("/restaurants/:id/approve", auth, onlyAdmin, async (req: any, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    restaurant.is_approved = true;
    restaurant.status = "active";
    await restaurant.save();
    res.json({ message: "Restaurant approved", restaurant });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Suspend a restaurant
router.put("/restaurants/:id/suspend", auth, onlyAdmin, async (req: any, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    restaurant.status = "suspended";
    await restaurant.save();
    res.json({ message: "Restaurant suspended", restaurant });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manage users: list
router.get("/users", auth, onlyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("full_name email phone role created_at");
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role / suspend
router.put("/users/:id", auth, onlyAdmin, async (req: any, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (req.body.role) user.role = req.body.role;
    if (typeof req.body.suspended !== "undefined") (user as any).suspended = !!req.body.suspended;
    await user.save();
    res.json({ message: "User updated", user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all menu items across restaurants
router.get("/menuitems", auth, onlyAdmin, async (req, res) => {
  try {
    const items = await MenuItem.find().populate("restaurant_id", "name");
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manage orders system-wide
router.get("/orders", auth, onlyAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("restaurant_id", "name").populate("customer_id", "full_name email").sort({ created_at: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics: totals and simple stats
router.get("/analytics/summary", auth, onlyAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenueAgg = await Order.aggregate([
      { $match: { payment_status: "completed" } },
      { $group: { _id: null, revenue: { $sum: "$total_amount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.revenue || 0;
    const totalRestaurants = await Restaurant.countDocuments();
    const totalRiders = await Rider.countDocuments();

    res.json({ totalOrders, totalRevenue, totalRestaurants, totalRiders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Daily orders/revenue for last N days
router.get("/analytics/daily", auth, onlyAdmin, async (req, res) => {
  try {
    const days = Number(req.query.days || 7);
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const data = await Order.aggregate([
      { $match: { created_at: { $gte: since }, payment_status: "completed" } },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            month: { $month: "$created_at" },
            day: { $dayOfMonth: "$created_at" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$total_amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rider locations
router.get("/riders/locations", auth, onlyAdmin, async (req, res) => {
  try {
    const riders = await Rider.find().select("user_id current_latitude current_longitude is_available").populate("user_id", "full_name phone");
    res.json(riders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

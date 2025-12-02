import express from "express";
import { auth } from "../middleware/auth";
import { Restaurant } from "../models/Restaurant";
import { User } from "../models/User";
import { MenuItem } from "../models/MenuItem";
import { Order } from "../models/Order";
import { Rider } from "../models/Rider";
import { Settings } from "../models/Settings";

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
    const users = await User.find().select("full_name email phone avatar_url suspended role created_at");
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

// Suspend a user
router.put("/users/:id/suspend", auth, onlyAdmin, async (req: any, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.suspended = true;
    // optional: set a status string, keep compatibility with client expectations
    (user as any).status = "suspended";
    await user.save();
    res.json({ message: "User suspended", user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Activate/reactivate a suspended user
router.put("/users/:id/activate", auth, onlyAdmin, async (req: any, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.suspended = false;
    (user as any).status = "active";
    await user.save();
    res.json({ message: "User activated", user });
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

// Manage orders system-wide - by default return open orders only. Use ?history=true to include delivered/cancelled orders.
router.get("/orders", auth, onlyAdmin, async (req, res) => {
  try {
    const history = String(req.query.history || '').toLowerCase() === 'true' || req.query.history === '1';
    const openStatuses = ["pending","accepted","preparing","ready","picked_up","on_the_way"];
    const q: any = {};
    if (!history) q.status = { $in: openStatuses };

    const orders = await Order.find(q).populate("restaurant_id", "name").populate("customer_id", "full_name email").sort({ created_at: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics: totals and simple stats
router.get("/analytics/summary", auth, onlyAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    // Total sales across the platform (sum of order total_amount for completed payments)
    const totalRevenueAgg = await Order.aggregate([
      { $match: { payment_status: "completed" } },
      { $group: { _id: null, revenue: { $sum: "$total_amount" }, appRevenue: { $sum: "$app_cut" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.revenue || 0;
    const totalAppRevenue = totalRevenueAgg[0]?.appRevenue || 0;
    const totalRestaurants = await Restaurant.countDocuments();
    const totalRiders = await Rider.countDocuments();

    res.json({ totalOrders, totalRevenue, totalAppRevenue, totalRestaurants, totalRiders });
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
            appRevenue: { $sum: "$app_cut" },
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
    // Return richer rider information (for admin UI) including vehicle info, delivery stats and verification
    const riders = await Rider.find().select("user_id vehicle_type vehicle_number is_available is_verified total_deliveries rating current_latitude current_longitude created_at updated_at").populate("user_id", "full_name phone avatar_url");
    res.json(riders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get global settings (create defaults if missing)
router.get("/settings", auth, onlyAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: "global" });
    if (!settings) {
      settings = await Settings.create({ key: "global" });
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Patch/update global settings (partial update allowed)
router.patch("/settings", auth, onlyAdmin, async (req: any, res) => {
  try {
    let settings = await Settings.findOne({ key: "global" });
    if (!settings) settings = await Settings.create({ key: "global" });

    // Merge allowed sections
    const allowed = ["ui", "notifications", "system", "delivery"];
    for (const section of allowed) {
      if (req.body[section]) {
        (settings as any)[section] = { ...(settings as any)[section], ...req.body[section] };
      }
    }

    await settings.save();
    res.json({ message: "Settings updated", settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

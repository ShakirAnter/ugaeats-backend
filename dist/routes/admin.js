"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Restaurant_1 = require("../models/Restaurant");
const User_1 = require("../models/User");
const MenuItem_1 = require("../models/MenuItem");
const Order_1 = require("../models/Order");
const Rider_1 = require("../models/Rider");
const router = express_1.default.Router();
// Middleware: only admin
const onlyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};
// Get all restaurants (with optional status filter)
router.get("/restaurants", auth_1.auth, onlyAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        const q = {};
        if (status)
            q.status = status;
        const restaurants = await Restaurant_1.Restaurant.find(q).populate("owner_id", "full_name email phone role");
        res.json(restaurants);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Approve a restaurant
router.put("/restaurants/:id/approve", auth_1.auth, onlyAdmin, async (req, res) => {
    try {
        const restaurant = await Restaurant_1.Restaurant.findById(req.params.id);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        restaurant.is_approved = true;
        restaurant.status = "active";
        await restaurant.save();
        res.json({ message: "Restaurant approved", restaurant });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Suspend a restaurant
router.put("/restaurants/:id/suspend", auth_1.auth, onlyAdmin, async (req, res) => {
    try {
        const restaurant = await Restaurant_1.Restaurant.findById(req.params.id);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        restaurant.status = "suspended";
        await restaurant.save();
        res.json({ message: "Restaurant suspended", restaurant });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Manage users: list
router.get("/users", auth_1.auth, onlyAdmin, async (req, res) => {
    try {
        const users = await User_1.User.find().select("full_name email phone role created_at");
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Update user role / suspend
router.put("/users/:id", auth_1.auth, onlyAdmin, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.params.id);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        if (req.body.role)
            user.role = req.body.role;
        if (typeof req.body.suspended !== "undefined")
            user.suspended = !!req.body.suspended;
        await user.save();
        res.json({ message: "User updated", user });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Get all menu items across restaurants
router.get("/menuitems", auth_1.auth, onlyAdmin, async (req, res) => {
    try {
        const items = await MenuItem_1.MenuItem.find().populate("restaurant_id", "name");
        res.json(items);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Manage orders system-wide
router.get("/orders", auth_1.auth, onlyAdmin, async (req, res) => {
    try {
        const orders = await Order_1.Order.find().populate("restaurant_id", "name").populate("customer_id", "full_name email").sort({ created_at: -1 });
        res.json(orders);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Analytics: totals and simple stats
router.get("/analytics/summary", auth_1.auth, onlyAdmin, async (req, res) => {
    var _a;
    try {
        const totalOrders = await Order_1.Order.countDocuments();
        const totalRevenueAgg = await Order_1.Order.aggregate([
            { $match: { payment_status: "completed" } },
            { $group: { _id: null, revenue: { $sum: "$total_amount" } } },
        ]);
        const totalRevenue = ((_a = totalRevenueAgg[0]) === null || _a === void 0 ? void 0 : _a.revenue) || 0;
        const totalRestaurants = await Restaurant_1.Restaurant.countDocuments();
        const totalRiders = await Rider_1.Rider.countDocuments();
        res.json({ totalOrders, totalRevenue, totalRestaurants, totalRiders });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Daily orders/revenue for last N days
router.get("/analytics/daily", auth_1.auth, onlyAdmin, async (req, res) => {
    try {
        const days = Number(req.query.days || 7);
        const since = new Date();
        since.setDate(since.getDate() - (days - 1));
        const data = await Order_1.Order.aggregate([
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Rider locations
router.get("/riders/locations", auth_1.auth, onlyAdmin, async (req, res) => {
    try {
        const riders = await Rider_1.Rider.find().select("user_id current_latitude current_longitude is_available").populate("user_id", "full_name phone");
        res.json(riders);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;

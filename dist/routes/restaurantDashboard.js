"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Restaurant_1 = require("../models/Restaurant");
const Order_1 = require("../models/Order");
const MenuItem_1 = require("../models/MenuItem");
const router = express_1.default.Router();
// Ensure restaurant owner or admin
const ownerOrAdmin = async (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ error: "Authenticate" });
    const restaurantId = req.query.restaurant_id || req.body.restaurant_id;
    if (!restaurantId)
        return res.status(400).json({ error: "restaurant_id required" });
    const restaurant = await Restaurant_1.Restaurant.findById(restaurantId);
    if (!restaurant)
        return res.status(404).json({ error: "Restaurant not found" });
    const isAdmin = req.user.role === "admin";
    const isOwner = restaurant.owner_id.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner)
        return res.status(403).json({ error: "Not authorized" });
    req.restaurant = restaurant;
    next();
};
// Dashboard summary for a restaurant
router.get("/summary", auth_1.auth, async (req, res) => {
    var _a, _b, _c;
    try {
        // restaurant id may come from query or derive from owner's restaurants
        const restaurantId = req.query.restaurant_id;
        if (!restaurantId)
            return res.status(400).json({ error: "restaurant_id is required" });
        // authorization: owner or admin
        const restaurant = await Restaurant_1.Restaurant.findById(restaurantId);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        const isAdmin = req.user.role === "admin";
        const isOwner = restaurant.owner_id.toString() === req.user._id.toString();
        if (!isAdmin && !isOwner)
            return res.status(403).json({ error: "Not authorized" });
        const totalOrders = await Order_1.Order.countDocuments({ restaurant_id: restaurant._id });
        // Revenue split: report total sales (total_amount), platform cuts and net restaurant earnings
        const revenueAgg = await Order_1.Order.aggregate([
            { $match: { restaurant_id: restaurant._id, payment_status: "completed" } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$total_amount" },
                    totalAppCuts: { $sum: "$app_cut" },
                    totalRestaurantEarnings: { $sum: "$restaurant_earnings" },
                },
            },
        ]);
        const totalRevenue = ((_a = revenueAgg[0]) === null || _a === void 0 ? void 0 : _a.totalSales) || 0;
        const totalAppCuts = ((_b = revenueAgg[0]) === null || _b === void 0 ? void 0 : _b.totalAppCuts) || 0;
        const totalRestaurantEarnings = ((_c = revenueAgg[0]) === null || _c === void 0 ? void 0 : _c.totalRestaurantEarnings) || 0;
        // best-selling items
        // Aggregate top selling items and include menu item data (image_url) via lookup
        const bestSelling = await Order_1.Order.aggregate([
            { $match: { restaurant_id: restaurant._id } },
            { $unwind: "$items" },
            { $group: { _id: "$items.menu_item_id", name: { $first: "$items.name" }, sold: { $sum: "$items.quantity" } } },
            // lookup the menu item document to fetch image_url
            { $lookup: { from: 'menuitems', localField: '_id', foreignField: '_id', as: 'menu_item' } },
            { $unwind: { path: '$menu_item', preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, name: 1, sold: 1, image_url: '$menu_item.image_url' } },
            { $sort: { sold: -1 } },
            { $limit: 5 },
        ]);
        res.json({ totalOrders, totalRevenue, totalAppCuts, totalRestaurantEarnings, bestSelling });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Orders history for restaurant
router.get("/orders", auth_1.auth, async (req, res) => {
    try {
        const restaurantId = req.query.restaurant_id;
        if (!restaurantId)
            return res.status(400).json({ error: "restaurant_id is required" });
        const restaurant = await Restaurant_1.Restaurant.findById(restaurantId);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        const isAdmin = req.user.role === "admin";
        const isOwner = restaurant.owner_id.toString() === req.user._id.toString();
        if (!isAdmin && !isOwner)
            return res.status(403).json({ error: "Not authorized" });
        const orders = await Order_1.Order.find({ restaurant_id: restaurant._id }).sort({ created_at: -1 });
        res.json(orders);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Menu management: list categories/items for restaurant
router.get("/menu", auth_1.auth, async (req, res) => {
    try {
        const restaurantId = req.query.restaurant_id;
        if (!restaurantId)
            return res.status(400).json({ error: "restaurant_id is required" });
        const restaurant = await Restaurant_1.Restaurant.findById(restaurantId);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        const isAdmin = req.user.role === "admin";
        const isOwner = restaurant.owner_id.toString() === req.user._id.toString();
        if (!isAdmin && !isOwner)
            return res.status(403).json({ error: "Not authorized" });
        const items = await MenuItem_1.MenuItem.find({ restaurant_id: restaurant._id });
        res.json(items);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;

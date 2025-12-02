import express from "express";
import { auth } from "../middleware/auth";
import { Restaurant } from "../models/Restaurant";
import { Order } from "../models/Order";
import { MenuItem } from "../models/MenuItem";

const router = express.Router();

// Ensure restaurant owner or admin
const ownerOrAdmin = async (req: any, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ error: "Authenticate" });
  const restaurantId = req.query.restaurant_id || req.body.restaurant_id;
  if (!restaurantId) return res.status(400).json({ error: "restaurant_id required" });
  const restaurant = await Restaurant.findById(restaurantId as string);
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
  const isAdmin = req.user.role === "admin";
  const isOwner = restaurant.owner_id.toString() === req.user._id.toString();
  if (!isAdmin && !isOwner) return res.status(403).json({ error: "Not authorized" });
  req.restaurant = restaurant;
  next();
};

// Dashboard summary for a restaurant
router.get("/summary", auth, async (req: any, res) => {
  try {
    // restaurant id may come from query or derive from owner's restaurants
    const restaurantId = req.query.restaurant_id as string;
    if (!restaurantId) return res.status(400).json({ error: "restaurant_id is required" });

    // authorization: owner or admin
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    const isAdmin = req.user.role === "admin";
    const isOwner = restaurant.owner_id.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) return res.status(403).json({ error: "Not authorized" });

    const totalOrders = await Order.countDocuments({ restaurant_id: restaurant._id });
    // Revenue split: report total sales (total_amount), platform cuts and net restaurant earnings
    const revenueAgg = await Order.aggregate([
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

    const totalRevenue = revenueAgg[0]?.totalSales || 0;
    const totalAppCuts = revenueAgg[0]?.totalAppCuts || 0;
    const totalRestaurantEarnings = revenueAgg[0]?.totalRestaurantEarnings || 0;

    // best-selling items
    // Aggregate top selling items and include menu item data (image_url) via lookup
    const bestSelling = await Order.aggregate([
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Orders history for restaurant
router.get("/orders", auth, async (req: any, res) => {
  try {
    const restaurantId = req.query.restaurant_id as string;
    if (!restaurantId) return res.status(400).json({ error: "restaurant_id is required" });
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    const isAdmin = req.user.role === "admin";
    const isOwner = restaurant.owner_id.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) return res.status(403).json({ error: "Not authorized" });

    const orders = await Order.find({ restaurant_id: restaurant._id }).sort({ created_at: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Menu management: list categories/items for restaurant
router.get("/menu", auth, async (req: any, res) => {
  try {
    const restaurantId = req.query.restaurant_id as string;
    if (!restaurantId) return res.status(400).json({ error: "restaurant_id is required" });
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    const isAdmin = req.user.role === "admin";
    const isOwner = restaurant.owner_id.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) return res.status(403).json({ error: "Not authorized" });

    const items = await MenuItem.find({ restaurant_id: restaurant._id });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

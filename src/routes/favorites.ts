import express from "express";
import mongoose from "mongoose";
import { auth } from "../middleware/auth";
import { User } from "../models/User";
import { Restaurant } from "../models/Restaurant";
import { MenuItem } from "../models/MenuItem";

const router = express.Router();

/**
 * Add restaurant to favorites
 */
router.post("/restaurant/:restaurantId", auth, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if already favorited
    if (!user.favorite_restaurants) user.favorite_restaurants = [];
    if (user.favorite_restaurants.includes(restaurantId)) {
      return res.status(400).json({ error: "Already in favorites" });
    }

    user.favorite_restaurants.push(restaurantId);
    await user.save();

    return res.json({ message: "Added to favorites", favorite_restaurants: user.favorite_restaurants });
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

/**
 * Remove restaurant from favorites
 */
router.delete("/restaurant/:restaurantId", auth, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.favorite_restaurants = (user.favorite_restaurants || []).filter(
      (id) => id.toString() !== restaurantId
    );
    await user.save();

    return res.json({ message: "Removed from favorites", favorite_restaurants: user.favorite_restaurants });
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

/**
 * Get user's favorite restaurants
 */
router.get("/restaurants", auth, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.favorite_restaurants || user.favorite_restaurants.length === 0) {
      return res.json([]);
    }

    const restaurantIds = user.favorite_restaurants.map(id => new mongoose.Types.ObjectId(id));
    const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } }).select('name image_url rating delivery_fee estimated_delivery_time cuisine_type description');

    return res.json(restaurants);
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

/**
 * Add dish to favorites
 */
router.post("/dish/:dishId", auth, async (req: any, res) => {
  try {
    const { dishId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.favorite_dishes) user.favorite_dishes = [];
    if (user.favorite_dishes.includes(dishId)) {
      return res.status(400).json({ error: "Already in favorites" });
    }

    user.favorite_dishes.push(dishId);
    await user.save();

    return res.json({ message: "Added to favorites", favorite_dishes: user.favorite_dishes });
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

/**
 * Remove dish from favorites
 */
router.delete("/dish/:dishId", auth, async (req: any, res) => {
  try {
    const { dishId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.favorite_dishes = (user.favorite_dishes || []).filter(
      (id) => id.toString() !== dishId
    );
    await user.save();

    return res.json({ message: "Removed from favorites", favorite_dishes: user.favorite_dishes });
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

/**
 * Get user's favorite dishes
 */
router.get("/dishes", auth, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.favorite_dishes || user.favorite_dishes.length === 0) {
      return res.json([]);
    }

    const dishIds = user.favorite_dishes.map(id => new mongoose.Types.ObjectId(id));
    const dishes = await MenuItem.find({ _id: { $in: dishIds } }).select('name image_url price restaurant_id').populate('restaurant_id', 'name');

    return res.json(dishes);
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

export default router;

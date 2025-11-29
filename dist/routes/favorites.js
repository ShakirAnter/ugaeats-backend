"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const Restaurant_1 = require("../models/Restaurant");
const MenuItem_1 = require("../models/MenuItem");
const router = express_1.default.Router();
/**
 * Add restaurant to favorites
 */
router.post("/restaurant/:restaurantId", auth_1.auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const userId = req.user._id;
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        // Check if already favorited
        if (!user.favorite_restaurants)
            user.favorite_restaurants = [];
        if (user.favorite_restaurants.includes(restaurantId)) {
            return res.status(400).json({ error: "Already in favorites" });
        }
        user.favorite_restaurants.push(restaurantId);
        await user.save();
        return res.json({ message: "Added to favorites", favorite_restaurants: user.favorite_restaurants });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Remove restaurant from favorites
 */
router.delete("/restaurant/:restaurantId", auth_1.auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const userId = req.user._id;
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        user.favorite_restaurants = (user.favorite_restaurants || []).filter((id) => id.toString() !== restaurantId);
        await user.save();
        return res.json({ message: "Removed from favorites", favorite_restaurants: user.favorite_restaurants });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Get user's favorite restaurants
 */
router.get("/restaurants", auth_1.auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        if (!user.favorite_restaurants || user.favorite_restaurants.length === 0) {
            return res.json([]);
        }
        const restaurantIds = user.favorite_restaurants.map(id => new mongoose_1.default.Types.ObjectId(id));
        const restaurants = await Restaurant_1.Restaurant.find({ _id: { $in: restaurantIds } }).select('name image_url rating delivery_fee estimated_delivery_time cuisine_type description');
        return res.json(restaurants);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Add dish to favorites
 */
router.post("/dish/:dishId", auth_1.auth, async (req, res) => {
    try {
        const { dishId } = req.params;
        const userId = req.user._id;
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        if (!user.favorite_dishes)
            user.favorite_dishes = [];
        if (user.favorite_dishes.includes(dishId)) {
            return res.status(400).json({ error: "Already in favorites" });
        }
        user.favorite_dishes.push(dishId);
        await user.save();
        return res.json({ message: "Added to favorites", favorite_dishes: user.favorite_dishes });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Remove dish from favorites
 */
router.delete("/dish/:dishId", auth_1.auth, async (req, res) => {
    try {
        const { dishId } = req.params;
        const userId = req.user._id;
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        user.favorite_dishes = (user.favorite_dishes || []).filter((id) => id.toString() !== dishId);
        await user.save();
        return res.json({ message: "Removed from favorites", favorite_dishes: user.favorite_dishes });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Get user's favorite dishes
 */
router.get("/dishes", auth_1.auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        if (!user.favorite_dishes || user.favorite_dishes.length === 0) {
            return res.json([]);
        }
        const dishIds = user.favorite_dishes.map(id => new mongoose_1.default.Types.ObjectId(id));
        const dishes = await MenuItem_1.MenuItem.find({ _id: { $in: dishIds } }).select('name image_url price restaurant_id').populate('restaurant_id', 'name');
        return res.json(dishes);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;

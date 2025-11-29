"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Review_1 = require("../models/Review");
const MenuItem_1 = require("../models/MenuItem");
const Restaurant_1 = require("../models/Restaurant");
const router = express_1.default.Router();
/**
 * Create a review for a menu item
 */
router.post("/item/:itemId", auth_1.auth, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { rating, comment } = req.body;
        const customerId = req.user._id;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }
        const menuItem = await MenuItem_1.MenuItem.findById(itemId);
        if (!menuItem)
            return res.status(404).json({ error: "Menu item not found" });
        const review = new Review_1.Review({
            customer_id: customerId,
            restaurant_id: menuItem.restaurant_id,
            restaurant_rating: rating,
            restaurant_comment: comment,
        });
        await review.save();
        return res.status(201).json(review);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Create a review for a restaurant (with order context)
 */
router.post("/restaurant/:restaurantId", auth_1.auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { orderId, restaurant_rating, restaurant_comment, rider_rating, rider_comment } = req.body;
        const customerId = req.user._id;
        if (!restaurant_rating || restaurant_rating < 1 || restaurant_rating > 5) {
            return res.status(400).json({ error: "Restaurant rating must be between 1 and 5" });
        }
        const restaurant = await Restaurant_1.Restaurant.findById(restaurantId);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        // Check if review already exists for this order (only if orderId is provided)
        if (orderId) {
            const existingReview = await Review_1.Review.findOne({ order_id: orderId });
            if (existingReview) {
                // Update existing review
                existingReview.restaurant_rating = restaurant_rating;
                existingReview.restaurant_comment = restaurant_comment;
                if (rider_rating)
                    existingReview.rider_rating = rider_rating;
                if (rider_comment)
                    existingReview.rider_comment = rider_comment;
                await existingReview.save();
                return res.json({ message: "Review updated", review: existingReview });
            }
        }
        const review = new Review_1.Review({
            ...(orderId && { order_id: orderId }),
            customer_id: customerId,
            restaurant_id: restaurantId,
            restaurant_rating,
            restaurant_comment,
            rider_rating,
            rider_comment,
        });
        await review.save();
        return res.status(201).json(review);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Get reviews for a menu item (deprecated endpoint)
 */
router.get("/item/:itemId", async (req, res) => {
    try {
        return res.status(400).json({ error: "Use /restaurant/:restaurantId endpoint instead" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Get reviews for a restaurant
 */
router.get("/restaurant/:restaurantId", async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const reviews = await Review_1.Review.find({ restaurant_id: restaurantId })
            .populate("customer_id", "full_name avatar_url")
            .sort({ created_at: -1 });
        const average = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + (r.restaurant_rating || 0), 0) / reviews.length).toFixed(1)
            : 0;
        return res.json({ reviews, average, count: reviews.length });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Delete a review
 */
router.delete("/:reviewId", auth_1.auth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;
        const review = await Review_1.Review.findById(reviewId);
        if (!review)
            return res.status(404).json({ error: "Review not found" });
        if (review.customer_id.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Not authorized to delete this review" });
        }
        await review.deleteOne();
        return res.json({ message: "Review deleted" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;

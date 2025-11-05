"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MenuItem_1 = require("../models/MenuItem");
const Restaurant_1 = require("../models/Restaurant");
const auth_1 = require("../middleware/auth");
const uploadToCloudinary_1 = require("../middleware/uploadToCloudinary"); // your existing middleware
const cloudinary_1 = require("cloudinary");
const router = express_1.default.Router();
/**
 * Create Menu Item with image upload
 */
router.post("/:restaurantId", auth_1.auth, (0, uploadToCloudinary_1.singleUploadToCloudinary)("image", "image_url", "UgaEats/menuItems"), async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { name, description, price, category_id, food_type_id, is_available = true, preparation_time, } = req.body;
        const restaurant = await Restaurant_1.Restaurant.findById(restaurantId);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        if (req.user.role !== "admin" &&
            restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ error: "Not authorized to add menu items" });
        }
        const menuItem = new MenuItem_1.MenuItem({
            restaurant_id: restaurantId,
            name,
            description,
            price,
            category_id,
            food_type_id,
            is_available,
            preparation_time,
            image_url: req.body.image_url,
            image_public_id: req.body.image_url_public_id, // optional, if you want to store public_id
        });
        await menuItem.save();
        return res.status(201).json(menuItem);
    }
    catch (error) {
        return res
            .status(400)
            .json({ error: error.message || "Error creating menu item" });
    }
});
/**
 * Update Menu Item (supports image replacement)
 */
router.patch("/:itemId", auth_1.auth, (0, uploadToCloudinary_1.singleUploadToCloudinary)("image", "image_url", "UgaEats/menuItems"), async (req, res) => {
    try {
        const { itemId } = req.params;
        const menuItem = await MenuItem_1.MenuItem.findById(itemId);
        if (!menuItem)
            return res.status(404).json({ error: "Menu item not found" });
        const restaurant = await Restaurant_1.Restaurant.findById(menuItem.restaurant_id);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        if (req.user.role !== "admin" &&
            restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ error: "Not authorized to update this menu item" });
        }
        // If new image uploaded, remove old one from Cloudinary
        if (req.body.image_url && menuItem.image_public_id) {
            try {
                await cloudinary_1.v2.uploader.destroy(menuItem.image_public_id);
            }
            catch (err) {
                console.warn("Failed to delete old menu item image", err);
            }
            menuItem.image_public_id = req.body.image_url_public_id;
        }
        Object.assign(menuItem, req.body, { updated_at: new Date() });
        await menuItem.save();
        return res.json(menuItem);
    }
    catch (error) {
        return res
            .status(400)
            .json({ error: error.message || "Error updating menu item" });
    }
});
/**
 * Delete Menu Item
 */
router.delete("/:itemId", auth_1.auth, async (req, res) => {
    try {
        const { itemId } = req.params;
        const menuItem = await MenuItem_1.MenuItem.findById(itemId);
        if (!menuItem)
            return res.status(404).json({ error: "Menu item not found" });
        const restaurant = await Restaurant_1.Restaurant.findById(menuItem.restaurant_id);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        if (req.user.role !== "admin" &&
            restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ error: "Not authorized to delete this menu item" });
        }
        // Remove image from Cloudinary
        if (menuItem.image_public_id) {
            try {
                await cloudinary_1.v2.uploader.destroy(menuItem.image_public_id);
            }
            catch (err) {
                console.warn("Failed to delete menu item image", err);
            }
        }
        await menuItem.deleteOne();
        return res.json({ message: "Menu item deleted successfully" });
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Error deleting menu item" });
    }
});
/**
 * Get all menu items for a restaurant
 */
router.get("/restaurant/:restaurantId", async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const menuItems = await MenuItem_1.MenuItem.find({ restaurant_id: restaurantId })
            .populate("category_id")
            .populate("food_type_id");
        return res.json(menuItems);
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Error fetching menu items" });
    }
});
exports.default = router;

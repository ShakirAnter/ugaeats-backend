"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Restaurant_1 = require("../models/Restaurant");
const MenuItem_1 = require("../models/MenuItem");
const uploadToCloudinary_1 = require("../middleware/uploadToCloudinary");
const cloudinary_1 = require("cloudinary");
const phone_1 = require("../utils/phone");
const router = express_1.default.Router();
// Create a restaurant
router.post("/", auth_1.auth, (0, uploadToCloudinary_1.singleUploadToCloudinary)("image", "image_url", "UgaEats/restaurants"), async (req, res) => {
    try {
        // Only users with role 'restaurant' or 'admin' can create restaurants
        const userRole = req.user.role;
        if (userRole !== "restaurant" && userRole !== "admin") {
            return res.status(403).json({
                error: "Only restaurant owners or admins can create restaurants",
            });
        }
        // If admin, they may optionally set owner_id; otherwise owner is the authenticated user
        const ownerId = userRole === "admin" && req.body.owner_id
            ? req.body.owner_id
            : req.user._id;
        // Normalize phone if provided
        if (req.body.phone) {
            const normalized = (0, phone_1.normalizeUgandaPhone)(req.body.phone);
            if (!normalized) {
                return res.status(400).json({
                    error: "Invalid phone number for restaurant. Accepts local (0XXXXXXXXX) or international (+256XXXXXXXXX).",
                });
            }
            req.body.phone = normalized;
        }
        const restaurant = new Restaurant_1.Restaurant({
            ...req.body,
            owner_id: ownerId,
        });
        await restaurant.save();
        return res.status(201).json(restaurant);
    }
    catch (error) {
        return res.status(400).json({
            error: (error === null || error === void 0 ? void 0 : error.message) || "Error creating restaurant",
        });
    }
});
// Get all restaurants
router.get("/", async (req, res) => {
    try {
        const restaurants = await Restaurant_1.Restaurant.find();
        return res.json(restaurants);
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: (error === null || error === void 0 ? void 0 : error.message) || "Error fetching restaurants" });
    }
});
// Get a specific restaurant
router.get("/:id", async (req, res) => {
    try {
        const restaurant = await Restaurant_1.Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }
        return res.json(restaurant);
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: (error === null || error === void 0 ? void 0 : error.message) || "Error fetching restaurant" });
    }
});
// Update a restaurant (owner or admin)
// Update restaurant (owner or admin). Supports replacing the restaurant image via `image` field.
router.patch("/:id", auth_1.auth, (0, uploadToCloudinary_1.singleUploadToCloudinary)("image", "image_url", "UgaEats/restaurants"), async (req, res) => {
    try {
        const restaurant = await Restaurant_1.Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }
        // Only owner or admin can update
        const userRole = req.user.role;
        if (userRole !== "admin" &&
            restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ error: "Not authorized to update this restaurant" });
        }
        if (req.file || req.body.image_url) {
            // old image
            const oldPublicId = restaurant.image_public_id;
            if (oldPublicId) {
                try {
                    await cloudinary_1.v2.uploader.destroy(oldPublicId);
                }
                catch (destroyErr) {
                    console.warn("Failed to delete old restaurant image from Cloudinary", destroyErr);
                }
            }
            // persist new image fields
            if (req.body.image_url_public_id) {
                restaurant.image_public_id = req.body.image_url_public_id;
            }
            if (req.body.image_url) {
                restaurant.image_url = req.body.image_url;
            }
        }
        // Normalize phone on update if provided
        if (req.body.phone) {
            const normalized = (0, phone_1.normalizeUgandaPhone)(req.body.phone);
            if (!normalized) {
                return res.status(400).json({
                    error: "Invalid phone number for restaurant. Accepts local (0XXXXXXXXX) or international (+256XXXXXXXXX).",
                });
            }
            req.body.phone = normalized;
        }
        Object.assign(restaurant, req.body);
        await restaurant.save();
        return res.json(restaurant);
    }
    catch (error) {
        console.error("Error updating restaurant:", error);
        return res.status(400).json({
            error: (error === null || error === void 0 ? void 0 : error.message) || "Error updating restaurant",
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
    }
});
// Delete a restaurant (owner or admin)
router.delete("/:id", auth_1.auth, async (req, res) => {
    try {
        const restaurant = await Restaurant_1.Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }
        // Only owner or admin can delete
        const userRole = req.user.role;
        if (userRole !== "admin" &&
            restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ error: "Not authorized to delete this restaurant" });
        }
        // Delete restaurant image from Cloudinary if present
        if (restaurant.image_public_id) {
            try {
                await cloudinary_1.v2.uploader.destroy(restaurant.image_public_id);
            }
            catch (destroyErr) {
                // Log and continue
                // eslint-disable-next-line no-console
                console.warn("Failed to delete restaurant image from Cloudinary", destroyErr);
            }
        }
        // Delete associated menu items
        try {
            await MenuItem_1.MenuItem.deleteMany({ restaurant_id: restaurant._id });
        }
        catch (menuErr) {
            // log and continue
            // eslint-disable-next-line no-console
            console.warn("Failed to delete menu items for restaurant", menuErr);
        }
        await restaurant.deleteOne();
        return res.json({ message: "Restaurant deleted", restaurant });
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: (error === null || error === void 0 ? void 0 : error.message) || "Error deleting restaurant" });
    }
});
// Create menu item
router.post("/:id/menu", auth_1.auth, async (req, res) => {
    try {
        const restaurant = await Restaurant_1.Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }
        // Only owner or admin can add menu items
        const userRole = req.user.role;
        if (userRole !== "admin" &&
            restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                error: "Not authorized to add menu items for this restaurant",
            });
        }
        const menuItem = new MenuItem_1.MenuItem({
            ...req.body,
            restaurant_id: restaurant._id,
        });
        await menuItem.save();
        return res.status(201).json(menuItem);
    }
    catch (error) {
        return res
            .status(400)
            .json({ error: (error === null || error === void 0 ? void 0 : error.message) || "Error creating menu item" });
    }
});
// Get restaurant menu
router.get("/:id/menu", async (req, res) => {
    try {
        const menuItems = await MenuItem_1.MenuItem.find({ restaurant_id: req.params.id });
        return res.json(menuItems);
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: (error === null || error === void 0 ? void 0 : error.message) || "Error fetching menu items" });
    }
});
exports.default = router;
// {
//     "name": "Mezo Noir",
//     "description": "Mezo Noir is a cozy restaurant in the heart of Kampala serving the community with delicious food.",
//     "address": "Off Kabojja, Plot 08 Somero Road, Kampala"
// }

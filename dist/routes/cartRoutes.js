"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/cartRoutes.ts
const express_1 = __importDefault(require("express"));
const Cart_1 = require("../models/Cart");
const MenuItem_1 = require("../models/MenuItem");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * Add or update item in a restaurant cart
 */
router.post("/:restaurantId/add", auth_1.auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { menu_item_id, quantity } = req.body;
        const menuItem = await MenuItem_1.MenuItem.findById(menu_item_id);
        if (!menuItem)
            return res.status(404).json({ error: "Menu item not found" });
        const price = menuItem.price;
        const subtotal = price * quantity;
        // Check if user already has a cart for this restaurant
        let cart = await Cart_1.Cart.findOne({
            user_id: req.user._id,
            restaurant_id: restaurantId,
        });
        if (!cart) {
            // Create new cart
            cart = new Cart_1.Cart({
                user_id: req.user._id,
                restaurant_id: restaurantId,
                items: [{ menu_item_id, quantity, price, subtotal }],
                total: subtotal,
            });
        }
        else {
            // If item exists, update quantity; else add new
            const existingItem = cart.items.find((i) => i.menu_item_id.toString() === menu_item_id);
            if (existingItem) {
                existingItem.quantity = quantity;
                existingItem.subtotal = price * quantity;
            }
            else {
                cart.items.push({ menu_item_id, quantity, price, subtotal });
            }
            cart.total = cart.items.reduce((sum, i) => sum + i.subtotal, 0);
        }
        await cart.save();
        return res.json(cart);
    }
    catch (error) {
        return res.status(500).json({
            error: error.message || "Error adding item to cart",
        });
    }
});
/**
 * Get all carts for logged-in user (from multiple restaurants)
 */
router.get("/", auth_1.auth, async (req, res) => {
    try {
        const carts = await Cart_1.Cart.find({ user_id: req.user._id })
            .populate("restaurant_id")
            .populate("items.menu_item_id");
        return res.json(carts);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Get one cart for a specific restaurant
 */
router.get("/:restaurantId", auth_1.auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const cart = await Cart_1.Cart.findOne({
            user_id: req.user._id,
            restaurant_id: restaurantId,
        })
            .populate("restaurant_id")
            .populate("items.menu_item_id");
        if (!cart)
            return res.status(404).json({ error: "Cart not found" });
        return res.json(cart);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Remove one item from a cart
 */
router.delete("/:restaurantId/item/:menuItemId", auth_1.auth, async (req, res) => {
    try {
        const { restaurantId, menuItemId } = req.params;
        const cart = await Cart_1.Cart.findOne({
            user_id: req.user._id,
            restaurant_id: restaurantId,
        });
        if (!cart)
            return res.status(404).json({ error: "Cart not found" });
        cart.items.pull({ menu_item_id: menuItemId });
        cart.total = cart.items.reduce((sum, i) => sum + i.subtotal, 0);
        await cart.save();
        return res.json(cart);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * Clear a restaurant cart
 */
router.delete("/:restaurantId/clear", auth_1.auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        await Cart_1.Cart.deleteOne({
            user_id: req.user._id,
            restaurant_id: restaurantId,
        });
        return res.json({ message: "Cart cleared successfully" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;

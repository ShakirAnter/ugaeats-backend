"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/cartRoutes.ts
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const Cart_1 = require("../models/Cart");
const MenuItem_1 = require("../models/MenuItem");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * Add or update item in a restaurant cart
 * POST /cart/:restaurantId/add
 */
router.post("/:restaurantId/add", auth_1.auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { menu_item_id, quantity, specialInstructions } = req.body;
        const menuItem = await MenuItem_1.MenuItem.findById(menu_item_id);
        if (!menuItem)
            return res.status(404).json({ error: "Menu item not found" });
        const price = Number(menuItem.price);
        const userId = new mongoose_1.default.Types.ObjectId(req.user._id);
        const restId = new mongoose_1.default.Types.ObjectId(restaurantId);
        let cart = await Cart_1.Cart.findOne({ user_id: userId, restaurant_id: restId });
        if (!cart) {
            cart = new Cart_1.Cart({
                user_id: userId,
                restaurant_id: restId,
                items: [
                    {
                        menu_item_id,
                        quantity: quantity !== null && quantity !== void 0 ? quantity : 1,
                        specialInstructions,
                        price,
                        subtotal: price * (quantity !== null && quantity !== void 0 ? quantity : 1),
                    },
                ],
                total: price * (quantity !== null && quantity !== void 0 ? quantity : 1),
            });
        }
        else {
            // existing cart: find existing item
            const existingItem = cart.items.find((i) => i.menu_item_id.toString() === menu_item_id);
            if (existingItem) {
                const qtyToAdd = quantity ? Number(quantity) : 1;
                existingItem.quantity += qtyToAdd;
                existingItem.subtotal = existingItem.price * existingItem.quantity;
                if (specialInstructions !== undefined)
                    existingItem.specialInstructions = specialInstructions;
            }
            else {
                const qty = quantity ? Number(quantity) : 1;
                cart.items.push({
                    menu_item_id,
                    quantity: qty,
                    specialInstructions,
                    price,
                    subtotal: price * qty,
                });
            }
            cart.total = cart.items.reduce((sum, i) => sum + i.subtotal, 0);
        }
        await cart.save();
        const populated = await Cart_1.Cart.findById(cart._id)
            .populate("restaurant_id")
            .populate("items.menu_item_id");
        return res.json(populated);
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ error: error.message || "Error adding item to cart" });
    }
});
/**
 * Get all carts for logged-in user
 * GET /cart
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
 * GET /cart/:restaurantId
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
 * Update quantity for a given item in a cart (or remove if quantity <= 0)
 * PUT /cart/:cartId/update-item
 * body: { menu_item_id, quantity }
 */
router.put("/:cartId/update-item", auth_1.auth, async (req, res) => {
    try {
        const { cartId } = req.params;
        const { menu_item_id, quantity } = req.body;
        const cart = await Cart_1.Cart.findById(cartId);
        if (!cart)
            return res.status(404).json({ error: "Cart not found" });
        const item = cart.items.find((it) => it.menu_item_id.toString() === menu_item_id ||
            it._id.toString() === menu_item_id);
        if (!item)
            return res.status(404).json({ error: "Item not found in cart" });
        const qty = Number(quantity);
        if (Number.isNaN(qty))
            return res.status(400).json({ error: "Invalid quantity" });
        // 🔸 Handle deletion or update
        if (qty <= 0) {
            cart.items.pull(item._id);
        }
        else {
            item.quantity = qty;
            item.subtotal = item.price * qty;
        }
        // 🔸 If all items are gone, delete the entire cart
        if (cart.items.length === 0) {
            await Cart_1.Cart.findByIdAndDelete(cart._id);
            return res.status(200).json({ message: "Cart deleted" });
        }
        // 🔸 Otherwise recalculate and save
        cart.total = cart.items.reduce((sum, i) => sum + i.subtotal, 0);
        await cart.save();
        const populated = await Cart_1.Cart.findById(cart._id)
            .populate("restaurant_id")
            .populate("items.menu_item_id");
        return res.json(populated);
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ error: error.message || "Failed to update item" });
    }
});
/**
 * Remove one item from a cart
 * POST /cart/:cartId/remove-item
 * body: { menu_item_id }
 */
router.post("/:cartId/remove-item", auth_1.auth, async (req, res) => {
    try {
        const { cartId } = req.params;
        const { menu_item_id } = req.body;
        const cart = await Cart_1.Cart.findById(cartId);
        if (!cart)
            return res.status(404).json({ error: "Cart not found" });
        // find subdoc by menu_item_id and pull by its _id
        const item = cart.items.find((it) => it.menu_item_id.toString() === menu_item_id);
        if (item) {
            cart.items.pull(item._id);
        }
        cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        await cart.save();
        const populated = await Cart_1.Cart.findById(cart._id)
            .populate("restaurant_id")
            .populate("items.menu_item_id");
        return res.json(populated);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to remove item from cart" });
    }
});
/**
 * Clear a restaurant cart
 * DELETE /cart/:restaurantId/clear
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

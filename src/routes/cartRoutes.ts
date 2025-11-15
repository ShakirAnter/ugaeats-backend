// routes/cartRoutes.ts
import express from "express";
import mongoose from "mongoose";
import { Cart } from "../models/Cart";
import { MenuItem } from "../models/MenuItem";
import { auth } from "../middleware/auth";

const router = express.Router();

/**
 * Add or update item in a restaurant cart
 * POST /cart/:restaurantId/add
 */
router.post("/:restaurantId/add", auth, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    const { menu_item_id, quantity, specialInstructions } = req.body;

    const menuItem = await MenuItem.findById(menu_item_id);
    if (!menuItem)
      return res.status(404).json({ error: "Menu item not found" });

    const price = Number(menuItem.price);
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const restId = new mongoose.Types.ObjectId(restaurantId);

    let cart = await Cart.findOne({ user_id: userId, restaurant_id: restId });

    if (!cart) {
      cart = new Cart({
        user_id: userId,
        restaurant_id: restId,
        items: [
          {
            menu_item_id,
            quantity: quantity ?? 1,
            specialInstructions,
            price,
            subtotal: price * (quantity ?? 1),
          },
        ],
        total: price * (quantity ?? 1),
      });
    } else {
      // existing cart: find existing item
      const existingItem = cart.items.find(
        (i: any) => i.menu_item_id.toString() === menu_item_id
      );

      if (existingItem) {
        const qtyToAdd = quantity ? Number(quantity) : 1;
        existingItem.quantity += qtyToAdd;
        existingItem.subtotal = existingItem.price * existingItem.quantity;
        if (specialInstructions !== undefined)
          existingItem.specialInstructions = specialInstructions;
      } else {
        const qty = quantity ? Number(quantity) : 1;
        cart.items.push({
          menu_item_id,
          quantity: qty,
          specialInstructions,
          price,
          subtotal: price * qty,
        });
      }

      cart.total = cart.items.reduce(
        (sum: number, i: any) => sum + i.subtotal,
        0
      );
    }

    await cart.save();
    const populated = await Cart.findById(cart._id)
      .populate("restaurant_id")
      .populate("items.menu_item_id");
    return res.json(populated);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: (error as any).message || "Error adding item to cart" });
  }
});

/**
 * Get all carts for logged-in user
 * GET /cart
 */
router.get("/", auth, async (req: any, res) => {
  try {
    const carts = await Cart.find({ user_id: req.user._id })
      .populate("restaurant_id")
      .populate("items.menu_item_id");
    return res.json(carts);
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

/**
 * Get one cart for a specific restaurant
 * GET /cart/:restaurantId
 */
router.get("/:restaurantId", auth, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    const cart = await Cart.findOne({
      user_id: req.user._id,
      restaurant_id: restaurantId,
    })
      .populate("restaurant_id")
      .populate("items.menu_item_id");

    if (!cart) return res.status(404).json({ error: "Cart not found" });
    return res.json(cart);
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

/**
 * Update quantity for a given item in a cart (or remove if quantity <= 0)
 * PUT /cart/:cartId/update-item
 * body: { menu_item_id, quantity }
 */
router.put("/:cartId/update-item", auth, async (req: any, res) => {
  try {
    const { cartId } = req.params;
    const { menu_item_id, quantity } = req.body;

    const cart = await Cart.findById(cartId);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.find(
      (it: any) =>
        it.menu_item_id.toString() === menu_item_id ||
        it._id.toString() === menu_item_id
    );

    if (!item) return res.status(404).json({ error: "Item not found in cart" });

    const qty = Number(quantity);
    if (Number.isNaN(qty))
      return res.status(400).json({ error: "Invalid quantity" });

    // 🔸 Handle deletion or update
    if (qty <= 0) {
      cart.items.pull(item._id);
    } else {
      item.quantity = qty;
      item.subtotal = item.price * qty;
    }

    // 🔸 If all items are gone, delete the entire cart
    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
      return res.status(200).json({ message: "Cart deleted" });
    }

    // 🔸 Otherwise recalculate and save
    cart.total = cart.items.reduce(
      (sum: number, i: any) => sum + i.subtotal,
      0
    );

    await cart.save();
    const populated = await Cart.findById(cart._id)
      .populate("restaurant_id")
      .populate("items.menu_item_id");
    return res.json(populated);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: (error as any).message || "Failed to update item" });
  }
});

/**
 * Remove one item from a cart
 * POST /cart/:cartId/remove-item
 * body: { menu_item_id }
 */
router.post("/:cartId/remove-item", auth, async (req: any, res) => {
  try {
    const { cartId } = req.params;
    const { menu_item_id } = req.body;

    const cart = await Cart.findById(cartId);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    // find subdoc by menu_item_id and pull by its _id
    const item = cart.items.find(
      (it: any) => it.menu_item_id.toString() === menu_item_id
    );
    if (item) {
      cart.items.pull(item._id);
    }

    cart.total = cart.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );
    await cart.save();

    const populated = await Cart.findById(cart._id)
      .populate("restaurant_id")
      .populate("items.menu_item_id");
    return res.json(populated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

/**
 * Clear a restaurant cart
 * DELETE /cart/:restaurantId/clear
 */
router.delete("/:restaurantId/clear", auth, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    await Cart.deleteOne({
      user_id: req.user._id,
      restaurant_id: restaurantId,
    });
    return res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

export default router;

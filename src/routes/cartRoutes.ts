// routes/cartRoutes.ts
import express from "express";
import { Cart } from "../models/Cart";
import { MenuItem } from "../models/MenuItem";
import { auth } from "../middleware/auth";

const router = express.Router();

/**
 * Add or update item in a restaurant cart
 */
import mongoose from "mongoose";

router.post("/:restaurantId/add", auth, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    const { menu_item_id, quantity } = req.body;

    const menuItem = await MenuItem.findById(menu_item_id);
    if (!menuItem)
      return res.status(404).json({ error: "Menu item not found" });

    const price = Number(menuItem.price);

    // Ensure IDs are ObjectId for proper comparison
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const restId = new mongoose.Types.ObjectId(restaurantId);

    // Find user's cart for this restaurant
    let cart = await Cart.findOne({
      user_id: userId,
      restaurant_id: restId,
    });

    if (!cart) {
      // Create a new cart
      cart = new Cart({
        user_id: userId,
        restaurant_id: restId,
        items: [
          {
            menu_item_id,
            quantity: quantity ?? 1,
            price,
            subtotal: price * (quantity ?? 1),
          },
        ],
        total: price * (quantity ?? 1),
      });
    } else {
      // Check if the item already exists
      const existingItem = cart.items.find(
        (i: any) => i.menu_item_id.toString() === menu_item_id
      );

      if (existingItem) {
        existingItem.quantity = quantity
          ? Number(quantity)
          : existingItem.quantity + 1;
        existingItem.subtotal = existingItem.price * existingItem.quantity;
      } else {
        const qty = quantity ? Number(quantity) : 1;
        cart.items.push({
          menu_item_id,
          quantity: qty,
          price,
          subtotal: price * qty,
        });
      }

      // Recalculate total
      cart.total = cart.items.reduce(
        (sum: number, i: any) => sum + i.subtotal,
        0
      );
    }

    await cart.save();
    return res.json(cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: (error as any).message || "Error adding item to cart",
    });
  }
});

/**
 * Get all carts for logged-in user (from multiple restaurants)
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
 * Remove one item from a cart
 */
router.post("/:cartId/remove-item", auth, async (req: any, res) => {
  try {
    const { cartId } = req.params;
    const { menu_item_id } = req.body;

    const cart = await Cart.findById(cartId);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    // Find the index of the item to remove
    const itemIndex = cart.items.findIndex((item) =>
      item.menu_item_id.equals(menu_item_id)
    );

    if (itemIndex !== -1) {
      cart.items.splice(itemIndex, 1); // remove 1 item at that index
    }

    // Recalculate total
    cart.total = cart.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );

    await cart.save();

    return res.json(cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

/**
 * Clear a restaurant cart
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

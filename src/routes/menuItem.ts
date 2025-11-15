import express from "express";
import { MenuItem } from "../models/MenuItem";
import { Restaurant } from "../models/Restaurant";
import { auth } from "../middleware/auth";
import { singleUploadToCloudinary } from "../middleware/uploadToCloudinary"; // your existing middleware
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

/**
 * Create Menu Item with image upload
 */
router.post(
  "/:restaurantId",
  auth,
  singleUploadToCloudinary("image", "image_url", "UgaEats/menuItems"),
  async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const {
        name,
        description,
        price,
        category_id,
        food_type_id,
        is_available = true,
        preparation_time,
      } = req.body;

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant)
        return res.status(404).json({ error: "Restaurant not found" });

      if (
        req.user.role !== "admin" &&
        restaurant.owner_id.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to add menu items" });
      }

      const menuItem = new MenuItem({
        restaurant_id: restaurantId,
        name,
        description,
        price,
        category_id,
        food_type_id,
        is_available,
        preparation_time,
        image_url: req.body.image_url,
        image_public_id: req.body.image_url_public_id,
      });

      await menuItem.save();
      return res.status(201).json(menuItem);
    } catch (error) {
      return res
        .status(400)
        .json({ error: (error as any).message || "Error creating menu item" });
    }
  }
);

/**
 * Update Menu Item (supports image replacement)
 */
router.patch(
  "/:itemId",
  auth,
  singleUploadToCloudinary("image", "image_url", "UgaEats/menuItems"),
  async (req: any, res) => {
    try {
      const { itemId } = req.params;
      const menuItem = await MenuItem.findById(itemId);
      if (!menuItem)
        return res.status(404).json({ error: "Menu item not found" });

      const restaurant = await Restaurant.findById(menuItem.restaurant_id);
      if (!restaurant)
        return res.status(404).json({ error: "Restaurant not found" });

      if (
        req.user.role !== "admin" &&
        restaurant.owner_id.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this menu item" });
      }

      if (req.body.image_url && menuItem.image_public_id) {
        try {
          await cloudinary.uploader.destroy(menuItem.image_public_id);
        } catch (err) {
          console.warn("Failed to delete old menu item image", err);
        }
        menuItem.image_public_id = req.body.image_url_public_id;
      }

      Object.assign(menuItem, req.body, { updated_at: new Date() });
      await menuItem.save();
      return res.json(menuItem);
    } catch (error) {
      return res
        .status(400)
        .json({ error: (error as any).message || "Error updating menu item" });
    }
  }
);

/**
 * Delete Menu Item
 */
router.delete("/:itemId", auth, async (req: any, res) => {
  try {
    const { itemId } = req.params;
    const menuItem = await MenuItem.findById(itemId);
    if (!menuItem)
      return res.status(404).json({ error: "Menu item not found" });

    const restaurant = await Restaurant.findById(menuItem.restaurant_id);
    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });

    if (
      req.user.role !== "admin" &&
      restaurant.owner_id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this menu item" });
    }

    if (menuItem.image_public_id) {
      try {
        await cloudinary.uploader.destroy(menuItem.image_public_id);
      } catch (err) {
        console.warn("Failed to delete menu item image", err);
      }
    }

    await menuItem.deleteOne();
    return res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any).message || "Error deleting menu item" });
  }
});

/**
 * Get all menu items for a restaurant
 */
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItems = await MenuItem.find({ restaurant_id: restaurantId })
      .populate("category_id")
      .populate("food_type_id");
    return res.json(menuItems);
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any).message || "Error fetching menu items" });
  }
});

/**
 * Get menu items by food type ID
 * Returns menu items grouped by restaurant
 */
router.get("/by-food-type/:foodTypeId", async (req, res) => {
  try {
    const { foodTypeId } = req.params;

    const menuItems = await MenuItem.find({ food_type_id: foodTypeId })
      .populate("restaurant_id")
      .populate("category_id")
      .populate("food_type_id");

    const groupedByRestaurant: {
      [key: string]: {
        restaurant: any;
        items: any[];
      };
    } = {};

    menuItems.forEach((item: any) => {
      const restaurantId = item.restaurant_id._id.toString();
      if (!groupedByRestaurant[restaurantId]) {
        groupedByRestaurant[restaurantId] = {
          restaurant: item.restaurant_id,
          items: [],
        };
      }
      groupedByRestaurant[restaurantId].items.push(item);
    });

    const result = Object.values(groupedByRestaurant);

    return res.json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any).message || "Error fetching menu items by food type" });
  }
});

/**
 * Get a single menu item by ID
 */
router.get("/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const menuItem = await MenuItem.findById(itemId)
      .populate("restaurant_id")
      .populate("category_id")
      .populate("food_type_id");
    
    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    
    return res.json(menuItem);
  } catch (error) {
    return res.status(500).json({ error: (error as any).message || "Error fetching menu item" });
  }
});

export default router;

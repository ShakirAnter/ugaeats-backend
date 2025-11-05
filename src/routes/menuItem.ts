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
        image_public_id: req.body.image_url_public_id, // optional, if you want to store public_id
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

      // If new image uploaded, remove old one from Cloudinary
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

    // Remove image from Cloudinary
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

export default router;





[
    {
        "_id": "690b1ca70b6ae6e0eda07bdd",
        "restaurant_id": "6909be253ec2dd9fe4681a02",
        "name": "Break Fast",
        "sort_order": 999,
        "created_at": "2025-11-05T09:45:11.244Z",
        "__v": 0
    },
    {
        "_id": "690b1cb10b6ae6e0eda07be1",
        "restaurant_id": "6909be253ec2dd9fe4681a02",
        "name": "Burgers",
        "sort_order": 999,
        "created_at": "2025-11-05T09:45:21.050Z",
        "__v": 0
    },
    {
        "_id": "690b1cbf0b6ae6e0eda07be5",
        "restaurant_id": "6909be253ec2dd9fe4681a02",
        "name": "Meat Corner",
        "sort_order": 999,
        "created_at": "2025-11-05T09:45:35.878Z",
        "__v": 0
    },
    {
        "_id": "690b1cca0b6ae6e0eda07be9",
        "restaurant_id": "6909be253ec2dd9fe4681a02",
        "name": "Rice Meals",
        "sort_order": 999,
        "created_at": "2025-11-05T09:45:46.412Z",
        "__v": 0
    },
    {
        "_id": "690b1cd80b6ae6e0eda07bed",
        "restaurant_id": "6909be253ec2dd9fe4681a02",
        "name": "Pilao Meals",
        "sort_order": 999,
        "created_at": "2025-11-05T09:46:00.363Z",
        "__v": 0
    },
    {
        "_id": "690b1ce10b6ae6e0eda07bf1",
        "restaurant_id": "6909be253ec2dd9fe4681a02",
        "name": "Salads",
        "sort_order": 999,
        "created_at": "2025-11-05T09:46:09.337Z",
        "__v": 0
    },
    {
        "_id": "690b1cea0b6ae6e0eda07bf5",
        "restaurant_id": "6909be253ec2dd9fe4681a02",
        "name": "Chips Meals",
        "sort_order": 999,
        "created_at": "2025-11-05T09:46:18.678Z",
        "__v": 0
    },
    {
        "_id": "690b1cf20b6ae6e0eda07bf9",
        "restaurant_id": "6909be253ec2dd9fe4681a02",
        "name": "Beverages",
        "sort_order": 999,
        "created_at": "2025-11-05T09:46:26.460Z",
        "__v": 0
    }
]
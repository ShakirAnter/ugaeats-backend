import express from "express";
import { auth } from "../middleware/auth";
import { Restaurant } from "../models/Restaurant";
import { MenuItem } from "../models/MenuItem";
import { singleUploadToCloudinary } from "../middleware/uploadToCloudinary";
import { v2 as cloudinary } from "cloudinary";
import { normalizeUgandaPhone } from "../utils/phone";

const router = express.Router();

// Create a restaurant
router.post(
  "/",
  auth,
  singleUploadToCloudinary("image", "image_url", "UgaEats/restaurants"),
  async (req: any, res) => {
    try {
      // Only users with role 'restaurant' or 'admin' can create restaurants
      const userRole = req.user.role as string;
      if (userRole !== "restaurant" && userRole !== "admin") {
        return res.status(403).json({
          error: "Only restaurant owners or admins can create restaurants",
        });
      }

      // If admin, they may optionally set owner_id; otherwise owner is the authenticated user
      const ownerId =
        userRole === "admin" && req.body.owner_id
          ? req.body.owner_id
          : req.user._id;

      // Normalize phone if provided
      if (req.body.phone) {
        const normalized = normalizeUgandaPhone(req.body.phone as string);
        if (!normalized) {
          return res.status(400).json({
            error:
              "Invalid phone number for restaurant. Accepts local (0XXXXXXXXX) or international (+256XXXXXXXXX).",
          });
        }
        req.body.phone = normalized;
      }

      const restaurant = new Restaurant({
        ...req.body,
        owner_id: ownerId,
      });
      await restaurant.save();
      return res.status(201).json(restaurant);
    } catch (error) {
      return res.status(400).json({
        error: (error as any)?.message || "Error creating restaurant",
      });
    }
  }
);

// Get all restaurants
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    return res.json(restaurants);
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any)?.message || "Error fetching restaurants" });
  }
});

// Get a specific restaurant
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    return res.json(restaurant);
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any)?.message || "Error fetching restaurant" });
  }
});

// Update a restaurant (owner or admin)
// Update restaurant (owner or admin). Supports replacing the restaurant image via `image` field.
router.patch(
  "/:id",
  auth,
  singleUploadToCloudinary("image", "image_url", "UgaEats/restaurants"),
  async (req: any, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      // Only owner or admin can update
      const userRole = req.user.role as string;
      if (
        userRole !== "admin" &&
        restaurant.owner_id.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this restaurant" });
      }

      if (req.file || req.body.image_url) {
        // old image
        const oldPublicId = restaurant.image_public_id;
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (destroyErr) {
            console.warn(
              "Failed to delete old restaurant image from Cloudinary",
              destroyErr
            );
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
        const normalized = normalizeUgandaPhone(req.body.phone as string);
        if (!normalized) {
          return res.status(400).json({
            error:
              "Invalid phone number for restaurant. Accepts local (0XXXXXXXXX) or international (+256XXXXXXXXX).",
          });
        }
        req.body.phone = normalized;
      }

      Object.assign(restaurant, req.body);
      await restaurant.save();
      return res.json(restaurant);
    } catch (error: any) {
      console.error("Error updating restaurant:", error);
      return res.status(400).json({
        error: error?.message || "Error updating restaurant",
        stack: error?.stack,
      });
    }
  }
);

// Delete a restaurant (owner or admin)
router.delete("/:id", auth, async (req: any, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Only owner or admin can delete
    const userRole = req.user.role as string;
    if (
      userRole !== "admin" &&
      restaurant.owner_id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this restaurant" });
    }

    // Delete restaurant image from Cloudinary if present
    if (restaurant.image_public_id) {
      try {
        await cloudinary.uploader.destroy(restaurant.image_public_id);
      } catch (destroyErr) {
        // Log and continue
        // eslint-disable-next-line no-console
        console.warn(
          "Failed to delete restaurant image from Cloudinary",
          destroyErr
        );
      }
    }

    // Delete associated menu items
    try {
      await MenuItem.deleteMany({ restaurant_id: restaurant._id });
    } catch (menuErr) {
      // log and continue
      // eslint-disable-next-line no-console
      console.warn("Failed to delete menu items for restaurant", menuErr);
    }

    await restaurant.deleteOne();
    return res.json({ message: "Restaurant deleted", restaurant });
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any)?.message || "Error deleting restaurant" });
  }
});

// Create menu item
router.post("/:id/menu", auth, async (req: any, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Only owner or admin can add menu items
    const userRole = req.user.role as string;
    if (
      userRole !== "admin" &&
      restaurant.owner_id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        error: "Not authorized to add menu items for this restaurant",
      });
    }

    const menuItem = new MenuItem({
      ...req.body,
      restaurant_id: restaurant._id,
    });

    await menuItem.save();
    return res.status(201).json(menuItem);
  } catch (error) {
    return res
      .status(400)
      .json({ error: (error as any)?.message || "Error creating menu item" });
  }
});

// Get restaurant menu
router.get("/:id/menu", async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurant_id: req.params.id });
    return res.json(menuItems);
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any)?.message || "Error fetching menu items" });
  }
});

export default router;

// {
//     "name": "Mezo Noir",
//     "description": "Mezo Noir is a cozy restaurant in the heart of Kampala serving the community with delicious food.",
//     "address": "Off Kabojja, Plot 08 Somero Road, Kampala"
// }

import express from "express";
import { Restaurant } from "../models/Restaurant";
import { MenuItem } from "../models/MenuItem";
import { FoodType } from "../models/FoodType";

const router = express.Router();

/**
 * Smart Search
 * Searches for restaurants, menu items, and food types based on query
 * Returns categorized results
 */
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchQuery = q.trim();
    const searchRegex = new RegExp(searchQuery, "i"); // case-insensitive

    // Search restaurants by name, description, or address
    const restaurantsPromise = Restaurant.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
      ],
    }).limit(10);

    // Search menu items by name or description
    const menuItemsPromise = MenuItem.find({
      $or: [{ name: searchRegex }, { description: searchRegex }],
      is_available: true,
    })
      .populate("restaurant_id")
      .populate("food_type_id")
      .limit(15);

    // Search food types by name
    const foodTypesPromise = FoodType.find({
      name: searchRegex,
    }).limit(10);

    const [restaurants, menuItems, foodTypes] = await Promise.all([
      restaurantsPromise,
      menuItemsPromise,
      foodTypesPromise,
    ]);

    // Organize results
    const results = {
      restaurants: restaurants.map((r) => ({
        _id: r._id,
        name: r.name,
        description: r.description,
        image_url: r.image_url,
        address: r.address,
        rating: r.rating,
        estimated_delivery_time: r.estimated_delivery_time,
        delivery_fee: r.delivery_fee,
        type: "restaurant",
      })),
      menuItems: menuItems.map((m: any) => ({
        _id: m._id,
        name: m.name,
        description: m.description,
        image_url: m.image_url,
        price: m.price,
        restaurant_id: m.restaurant_id,
        food_type_id: m.food_type_id,
        type: "menuItem",
      })),
      foodTypes: foodTypes.map((f) => ({
        _id: f._id,
        name: f.name,
        icon: f.icon,
        type: "foodType",
      })),
    };

    return res.json(results);
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any).message || "Error searching" });
  }
});

export default router;

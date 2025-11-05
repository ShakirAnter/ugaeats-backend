// routes/foodTypes.ts
import express from "express";
import { FoodType } from "../models/FoodType";
import { auth } from "../middleware/auth";

const router = express.Router();

/**
 * Predefined food types (including Drinks)
 */
export const defaultFoodTypes = [
  { name: "Pizzas" },
  { name: "Burgers" },
  { name: "Sandwiches" },
  { name: "Salads" },
  { name: "Pasta" },
  { name: "Rice & Noodles" },
  { name: "Soups" },
  { name: "Seafood" },
  { name: "Steaks & Grills" },
  { name: "Breakfast" },
  { name: "Snacks & Appetizers" },
  { name: "Desserts" },
  { name: "Beverages" },
  { name: "Drinks" },
  { name: "Fast Food" },
  { name: "Vegan & Vegetarian" },
];

/**
 * Seed default food types
 */
export async function seedFoodTypes() {
  try {
    for (const ft of defaultFoodTypes) {
      const exists = await FoodType.findOne({ name: ft.name });
      if (!exists) {
        await FoodType.create(ft);
        console.log(`Created food type: ${ft.name}`);
      } else {
        console.log(`Already exists: ${ft.name}`);
      }
    }
    console.log("Food types seeding complete!");
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

/**
 * Create Food Type (Admins only)
 */
router.post("/", auth, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can create food types" });
    }

    const { name } = req.body;
    if (!name)
      return res.status(400).json({ error: "Food type name is required" });

    const existing = await FoodType.findOne({ name });
    if (existing)
      return res.status(400).json({ error: "Food type already exists" });

    const foodType = new FoodType({ name });
    await foodType.save();

    return res.status(201).json(foodType);
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any).message || "Error creating food type" });
  }
});

/**
 * Get all Food Types
 */
router.get("/", async (req, res) => {
  try {
    const foodTypes = await FoodType.find().sort({ name: 1 });
    return res.json(foodTypes);
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any).message || "Error fetching food types" });
  }
});

/**
 * Update Food Type (Admins only)
 */
router.patch("/:id", auth, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can update food types" });
    }

    const foodType = await FoodType.findById(req.params.id);
    if (!foodType)
      return res.status(404).json({ error: "Food type not found" });

    Object.assign(foodType, req.body);
    await foodType.save();

    return res.json(foodType);
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any).message || "Error updating food type" });
  }
});

/**
 * Delete Food Type (Admins only)
 */
router.delete("/:id", auth, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can delete food types" });
    }

    const foodType = await FoodType.findById(req.params.id);
    if (!foodType)
      return res.status(404).json({ error: "Food type not found" });

    await foodType.deleteOne();
    return res.json({ message: "Food type deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as any).message || "Error deleting food type" });
  }
});

export default router;

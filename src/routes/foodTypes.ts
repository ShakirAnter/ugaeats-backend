// routes/foodTypes.ts
import express from "express";
import { FoodType } from "../models/FoodType";
import { auth } from "../middleware/auth";
import { singleUploadToCloudinary } from "../middleware/uploadToCloudinary";

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
 * Supports updating `name` and uploading an `icon` to Cloudinary
 */
router.patch(
  "/:id",
  auth,
  singleUploadToCloudinary("icon", "icon", "foodtypes/icons"), // Uploads to Cloudinary folder
  async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Only admins can update food types" });
      }

      const foodType = await FoodType.findById(req.params.id);
      if (!foodType)
        return res.status(404).json({ error: "Food type not found" });

      // ✅ Update name if provided
      if (req.body.name) {
        foodType.name = req.body.name;
      }

      // ✅ Update icon URL if new image uploaded
      if (req.body.icon) {
        foodType.icon = req.body.icon;
      }

      await foodType.save();

      return res.json({
        message: "Food type updated successfully",
        foodType,
      });
    } catch (error: any) {
      console.error("Error updating food type:", error);
      return res
        .status(500)
        .json({ error: error.message || "Error updating food type" });
    }
  }
);

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




[
    {
        "_id": "690a0d83f8cc0262f1816adf",
        "name": "Beverages",
        "created_at": "2025-11-04T14:28:19.048Z",
        "__v": 0
    },
    {
        "_id": "690a0d81f8cc0262f1816ad6",
        "name": "Breakfast",
        "created_at": "2025-11-04T14:28:17.507Z",
        "__v": 0
    },
    {
        "_id": "690a0d7df8cc0262f1816abe",
        "name": "Burgers",
        "created_at": "2025-11-04T14:28:13.419Z",
        "__v": 0
    },
    {
        "_id": "690a0d82f8cc0262f1816adc",
        "name": "Desserts",
        "created_at": "2025-11-04T14:28:18.523Z",
        "__v": 0
    },
    {
        "_id": "690a0d83f8cc0262f1816ae2",
        "name": "Drinks",
        "created_at": "2025-11-04T14:28:19.649Z",
        "__v": 0
    },
    {
        "_id": "690a0d84f8cc0262f1816ae5",
        "name": "Fast Food",
        "created_at": "2025-11-04T14:28:20.321Z",
        "__v": 0
    },
    {
        "_id": "690a0d7ef8cc0262f1816ac7",
        "name": "Pasta",
        "created_at": "2025-11-04T14:28:14.954Z",
        "__v": 0
    },
    {
        "_id": "690a0d7cf8cc0262f1816aba",
        "name": "Pizzas",
        "created_at": "2025-11-04T14:28:12.654Z",
        "__v": 0
    },
    {
        "_id": "690a0d7ff8cc0262f1816aca",
        "name": "Rice & Noodles",
        "created_at": "2025-11-04T14:28:15.457Z",
        "__v": 0
    },
    {
        "_id": "690a0d7ef8cc0262f1816ac4",
        "name": "Salads",
        "created_at": "2025-11-04T14:28:14.453Z",
        "__v": 0
    },
    {
        "_id": "690a0d7df8cc0262f1816ac1",
        "name": "Sandwiches",
        "created_at": "2025-11-04T14:28:13.942Z",
        "__v": 0
    },
    {
        "_id": "690a0d80f8cc0262f1816ad0",
        "name": "Seafood",
        "created_at": "2025-11-04T14:28:16.482Z",
        "__v": 0
    },
    {
        "_id": "690a0d82f8cc0262f1816ad9",
        "name": "Snacks & Appetizers",
        "created_at": "2025-11-04T14:28:18.018Z",
        "__v": 0
    },
    {
        "_id": "690a0d7ff8cc0262f1816acd",
        "name": "Soups",
        "created_at": "2025-11-04T14:28:15.959Z",
        "__v": 0
    },
    {
        "_id": "690a0d80f8cc0262f1816ad3",
        "name": "Steaks & Grills",
        "created_at": "2025-11-04T14:28:16.994Z",
        "__v": 0
    },
    {
        "_id": "690a0d84f8cc0262f1816ae8",
        "name": "Vegan & Vegetarian",
        "created_at": "2025-11-04T14:28:20.935Z",
        "__v": 0
    }
]
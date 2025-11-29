"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultFoodTypes = void 0;
exports.seedFoodTypes = seedFoodTypes;
// routes/foodTypes.ts
const express_1 = __importDefault(require("express"));
const FoodType_1 = require("../models/FoodType");
const auth_1 = require("../middleware/auth");
const uploadToCloudinary_1 = require("../middleware/uploadToCloudinary");
const router = express_1.default.Router();
/**
 * Predefined food types (including Drinks)
 */
exports.defaultFoodTypes = [
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
async function seedFoodTypes() {
    try {
        for (const ft of exports.defaultFoodTypes) {
            const exists = await FoodType_1.FoodType.findOne({ name: ft.name });
            if (!exists) {
                await FoodType_1.FoodType.create(ft);
                console.log(`Created food type: ${ft.name}`);
            }
            else {
                console.log(`Already exists: ${ft.name}`);
            }
        }
        console.log("Food types seeding complete!");
    }
    catch (err) {
        console.error("Seeding error:", err);
    }
}
/**
 * Create Food Type (Admins only)
 */
router.post("/", auth_1.auth, (0, uploadToCloudinary_1.singleUploadToCloudinary)("icon", "icon", "UgaEats/foodtypes/icons"), async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ error: "Only admins can create food types" });
        }
        const { name } = req.body;
        if (!name)
            return res.status(400).json({ error: "Food type name is required" });
        const existing = await FoodType_1.FoodType.findOne({ name });
        if (existing)
            return res.status(400).json({ error: "Food type already exists" });
        const foodType = new FoodType_1.FoodType({ name });
        await foodType.save();
        return res.status(201).json(foodType);
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Error creating food type" });
    }
});
/**
 * Get all Food Types
 */
router.get("/", async (req, res) => {
    try {
        const foodTypes = await FoodType_1.FoodType.find().sort({ name: 1 });
        return res.json(foodTypes);
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Error fetching food types" });
    }
});
/**
 * Update Food Type (Admins only)
 * Supports updating `name` and uploading an `icon` to Cloudinary
 */
router.patch("/:id", auth_1.auth, (0, uploadToCloudinary_1.singleUploadToCloudinary)("icon", "icon", "UgaEats/foodtypes/icons"), // Uploads to Cloudinary folder
async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ error: "Only admins can update food types" });
        }
        const foodType = await FoodType_1.FoodType.findById(req.params.id);
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
    }
    catch (error) {
        console.error("Error updating food type:", error);
        return res
            .status(500)
            .json({ error: error.message || "Error updating food type" });
    }
});
/**
 * Delete Food Type (Admins only)
 */
router.delete("/:id", auth_1.auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ error: "Only admins can delete food types" });
        }
        const foodType = await FoodType_1.FoodType.findById(req.params.id);
        if (!foodType)
            return res.status(404).json({ error: "Food type not found" });
        await foodType.deleteOne();
        return res.json({ message: "Food type deleted successfully" });
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Error deleting food type" });
    }
});
exports.default = router;
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
];

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
router.post("/", auth_1.auth, async (req, res) => {
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
 */
router.patch("/:id", auth_1.auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ error: "Only admins can update food types" });
        }
        const foodType = await FoodType_1.FoodType.findById(req.params.id);
        if (!foodType)
            return res.status(404).json({ error: "Food type not found" });
        Object.assign(foodType, req.body);
        await foodType.save();
        return res.json(foodType);
    }
    catch (error) {
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

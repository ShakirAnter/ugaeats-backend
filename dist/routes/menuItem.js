"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MenuItem_1 = require("../models/MenuItem");
const Restaurant_1 = require("../models/Restaurant");
const auth_1 = require("../middleware/auth");
const uploadToCloudinary_1 = require("../middleware/uploadToCloudinary"); // your existing middleware
const cloudinary_1 = require("cloudinary");
const router = express_1.default.Router();
/**
 * Create Menu Item with image upload
 */
router.post("/:restaurantId", auth_1.auth, (0, uploadToCloudinary_1.singleUploadToCloudinary)("image", "image_url", "UgaEats/menuItems"), async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { name, description, price, category_id, food_type_id, is_available = true, preparation_time, } = req.body;
        const restaurant = await Restaurant_1.Restaurant.findById(restaurantId);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        if (req.user.role !== "admin" &&
            restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ error: "Not authorized to add menu items" });
        }
        const menuItem = new MenuItem_1.MenuItem({
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
    }
    catch (error) {
        return res
            .status(400)
            .json({ error: error.message || "Error creating menu item" });
    }
});
/**
 * Update Menu Item (supports image replacement)
 */
router.patch("/:itemId", auth_1.auth, (0, uploadToCloudinary_1.singleUploadToCloudinary)("image", "image_url", "UgaEats/menuItems"), async (req, res) => {
    try {
        const { itemId } = req.params;
        const menuItem = await MenuItem_1.MenuItem.findById(itemId);
        if (!menuItem)
            return res.status(404).json({ error: "Menu item not found" });
        const restaurant = await Restaurant_1.Restaurant.findById(menuItem.restaurant_id);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        if (req.user.role !== "admin" &&
            restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ error: "Not authorized to update this menu item" });
        }
        if (req.body.image_url && menuItem.image_public_id) {
            try {
                await cloudinary_1.v2.uploader.destroy(menuItem.image_public_id);
            }
            catch (err) {
                console.warn("Failed to delete old menu item image", err);
            }
            menuItem.image_public_id = req.body.image_url_public_id;
        }
        Object.assign(menuItem, req.body, { updated_at: new Date() });
        await menuItem.save();
        return res.json(menuItem);
    }
    catch (error) {
        return res
            .status(400)
            .json({ error: error.message || "Error updating menu item" });
    }
});
/**
 * Delete Menu Item
 */
router.delete("/:itemId", auth_1.auth, async (req, res) => {
    try {
        const { itemId } = req.params;
        const menuItem = await MenuItem_1.MenuItem.findById(itemId);
        if (!menuItem)
            return res.status(404).json({ error: "Menu item not found" });
        const restaurant = await Restaurant_1.Restaurant.findById(menuItem.restaurant_id);
        if (!restaurant)
            return res.status(404).json({ error: "Restaurant not found" });
        if (req.user.role !== "admin" &&
            restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ error: "Not authorized to delete this menu item" });
        }
        if (menuItem.image_public_id) {
            try {
                await cloudinary_1.v2.uploader.destroy(menuItem.image_public_id);
            }
            catch (err) {
                console.warn("Failed to delete menu item image", err);
            }
        }
        await menuItem.deleteOne();
        return res.json({ message: "Menu item deleted successfully" });
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Error deleting menu item" });
    }
});
/**
 * Get all menu items for a restaurant
 */
router.get("/restaurant/:restaurantId", async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const menuItems = await MenuItem_1.MenuItem.find({ restaurant_id: restaurantId })
            .populate("category_id")
            .populate("food_type_id");
        return res.json(menuItems);
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Error fetching menu items" });
    }
});
/**
 * Get menu items by food type ID
 * Returns menu items grouped by restaurant
 */
router.get("/by-food-type/:foodTypeId", async (req, res) => {
    try {
        const { foodTypeId } = req.params;
        const menuItems = await MenuItem_1.MenuItem.find({ food_type_id: foodTypeId })
            .populate("restaurant_id")
            .populate("category_id")
            .populate("food_type_id");
        const groupedByRestaurant = {};
        menuItems.forEach((item) => {
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
    }
    catch (error) {
        return res
            .status(500)
            .json({
            error: error.message || "Error fetching menu items by food type",
        });
    }
});
/**
 * Get a single menu item by ID
 */
router.get("/:itemId", async (req, res) => {
    try {
        const { itemId } = req.params;
        const menuItem = await MenuItem_1.MenuItem.findById(itemId)
            .populate("restaurant_id")
            .populate("category_id")
            .populate("food_type_id");
        if (!menuItem) {
            return res.status(404).json({ error: "Menu item not found" });
        }
        return res.json(menuItem);
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Error fetching menu item" });
    }
});
exports.default = router;
[
    {
        _id: "69218c60a07e2b91ca937816",
        restaurant_id: "692186e3a07e2b91ca93758d",
        category_id: {
            _id: "69218964a07e2b91ca9377dc",
            restaurant_id: "692186e3a07e2b91ca93758d",
            name: "Cold Starters",
            description: "",
            sort_order: 999,
            created_at: "2025-11-22T09:59:00.671Z",
            __v: 0,
        },
        food_type_id: {
            _id: "690a0d84f8cc0262f1816ae5",
            name: "Fast Food",
            created_at: "2025-11-04T14:28:20.321Z",
            __v: 0,
            icon: "https://res.cloudinary.com/ddnljoevw/image/upload/v1762512399/foodtypes/icons/oxshvt9ytmw1wf7km5ye.png",
        },
        name: "Hummus with chicken shawarma",
        description: "Hummus tahina topped with chicken shawarma and olive oil. Served with pita bread.",
        price: 25000,
        is_available: true,
        preparation_time: 15,
        created_at: "2025-11-22T10:11:44.541Z",
        updated_at: "2025-11-22T10:11:44.541Z",
        __v: 0,
    },
    {
        _id: "69218c8ba07e2b91ca93781b",
        restaurant_id: "692186e3a07e2b91ca93758d",
        category_id: {
            _id: "69218964a07e2b91ca9377dc",
            restaurant_id: "692186e3a07e2b91ca93758d",
            name: "Cold Starters",
            description: "",
            sort_order: 999,
            created_at: "2025-11-22T09:59:00.671Z",
            __v: 0,
        },
        food_type_id: {
            _id: "690a0d84f8cc0262f1816ae5",
            name: "Fast Food",
            created_at: "2025-11-04T14:28:20.321Z",
            __v: 0,
            icon: "https://res.cloudinary.com/ddnljoevw/image/upload/v1762512399/foodtypes/icons/oxshvt9ytmw1wf7km5ye.png",
        },
        name: "Hummus with beef shawarma",
        description: "Hummus topped with beef shawarma. Served with pita bread, olives.",
        price: 25000,
        is_available: true,
        preparation_time: 15,
        created_at: "2025-11-22T10:12:27.274Z",
        updated_at: "2025-11-22T10:12:27.274Z",
        __v: 0,
    },
    {
        _id: "69218cfea07e2b91ca937820",
        restaurant_id: "692186e3a07e2b91ca93758d",
        category_id: {
            _id: "69218964a07e2b91ca9377dc",
            restaurant_id: "692186e3a07e2b91ca93758d",
            name: "Cold Starters",
            description: "",
            sort_order: 999,
            created_at: "2025-11-22T09:59:00.671Z",
            __v: 0,
        },
        food_type_id: {
            _id: "690a0d84f8cc0262f1816ae5",
            name: "Fast Food",
            created_at: "2025-11-04T14:28:20.321Z",
            __v: 0,
            icon: "https://res.cloudinary.com/ddnljoevw/image/upload/v1762512399/foodtypes/icons/oxshvt9ytmw1wf7km5ye.png",
        },
        name: "Bruschetta Classic",
        description: "Toasted bread topped with a fresh tomato, basil, and garlic relish. Drizzled with extra virgin olive oil for a burst of Mediterranean flavor. A simple yet unforgettable appetizer.",
        price: 25000,
        is_available: true,
        preparation_time: 15,
        created_at: "2025-11-22T10:14:22.117Z",
        updated_at: "2025-11-22T10:14:22.117Z",
        __v: 0,
    },
    {
        _id: "69218daca07e2b91ca937825",
        restaurant_id: "692186e3a07e2b91ca93758d",
        category_id: {
            _id: "69218964a07e2b91ca9377dc",
            restaurant_id: "692186e3a07e2b91ca93758d",
            name: "Cold Starters",
            description: "",
            sort_order: 999,
            created_at: "2025-11-22T09:59:00.671Z",
            __v: 0,
        },
        food_type_id: {
            _id: "690a0d84f8cc0262f1816ae5",
            name: "Fast Food",
            created_at: "2025-11-04T14:28:20.321Z",
            __v: 0,
            icon: "https://res.cloudinary.com/ddnljoevw/image/upload/v1762512399/foodtypes/icons/oxshvt9ytmw1wf7km5ye.png",
        },
        name: "Hummus Tahina",
        description: "Creamy and authentic hummus, made with the finest chickpeas and rich Tahini. Served with pita bread, and a drizzle of extra virgin olive oil. Perfect for sharing and enjoying the authentic flavors of the Mediterranean",
        price: 20000,
        is_available: true,
        preparation_time: 15,
        created_at: "2025-11-22T10:17:16.977Z",
        updated_at: "2025-11-22T10:17:16.977Z",
        __v: 0,
    },
];

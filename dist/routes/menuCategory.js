"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MenuCategory_1 = require("../models/MenuCategory");
const Restaurant_1 = require("../models/Restaurant");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * Create a Menu Category
 */
router.post('/:restaurantId', auth_1.auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { name, description, sort_order } = req.body;
        // Validate restaurant ownership
        const restaurant = await Restaurant_1.Restaurant.findById(restaurantId);
        if (!restaurant)
            return res.status(404).json({ error: 'Restaurant not found' });
        if (req.user.role !== 'admin' && restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to add categories' });
        }
        // Optional: set default sort_order if not provided
        const order = sort_order !== null && sort_order !== void 0 ? sort_order : 999;
        const category = new MenuCategory_1.MenuCategory({
            restaurant_id: restaurantId,
            name,
            description,
            sort_order: order
        });
        await category.save();
        return res.status(201).json(category);
    }
    catch (error) {
        return res.status(400).json({ error: error.message || 'Error creating category' });
    }
});
/**
 * Update a Menu Category
 */
router.patch('/:categoryId', auth_1.auth, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, description, sort_order } = req.body;
        const category = await MenuCategory_1.MenuCategory.findById(categoryId);
        if (!category)
            return res.status(404).json({ error: 'Category not found' });
        const restaurant = await Restaurant_1.Restaurant.findById(category.restaurant_id);
        if (!restaurant)
            return res.status(404).json({ error: 'Restaurant not found' });
        // Only owner or admin can update
        if (req.user.role !== 'admin' && restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to update this category' });
        }
        if (name)
            category.name = name;
        if (description)
            category.description = description;
        if (sort_order !== undefined)
            category.sort_order = sort_order;
        await category.save();
        return res.json(category);
    }
    catch (error) {
        return res.status(400).json({ error: error.message || 'Error updating category' });
    }
});
/**
 * Delete a Menu Category
 */
router.delete('/:categoryId', auth_1.auth, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await MenuCategory_1.MenuCategory.findById(categoryId);
        if (!category)
            return res.status(404).json({ error: 'Category not found' });
        const restaurant = await Restaurant_1.Restaurant.findById(category.restaurant_id);
        if (!restaurant)
            return res.status(404).json({ error: 'Restaurant not found' });
        // Only owner or admin can delete
        if (req.user.role !== 'admin' && restaurant.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this category' });
        }
        await category.deleteOne();
        return res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Error deleting category' });
    }
});
/**
 * Get all categories for a restaurant (sorted)
 */
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const categories = await MenuCategory_1.MenuCategory.find({ restaurant_id: restaurantId }).sort({ sort_order: 1 });
        return res.json(categories);
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Error fetching categories' });
    }
});
exports.default = router;

import express from 'express';
import { MenuCategory } from '../models/MenuCategory';
import { Restaurant } from '../models/Restaurant';
import { auth } from '../middleware/auth';

const router = express.Router();

/**
 * Create a Menu Category
 */
router.post('/:restaurantId', auth, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, description, sort_order } = req.body;

    // Validate restaurant ownership
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    if (req.user.role !== 'admin' && restaurant.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to add categories' });
    }

    // Optional: set default sort_order if not provided
    const order = sort_order ?? 999;

    const category = new MenuCategory({
      restaurant_id: restaurantId,
      name,
      description,
      sort_order: order
    });

    await category.save();
    return res.status(201).json(category);
  } catch (error) {
    return res.status(400).json({ error: (error as any).message || 'Error creating category' });
  }
});

/**
 * Update a Menu Category
 */
router.patch('/:categoryId', auth, async (req: any, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, sort_order } = req.body;

    const category = await MenuCategory.findById(categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const restaurant = await Restaurant.findById(category.restaurant_id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    // Only owner or admin can update
    if (req.user.role !== 'admin' && restaurant.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this category' });
    }

    if (name) category.name = name;
    if (description) category.description = description;
    if (sort_order !== undefined) category.sort_order = sort_order;

    await category.save();
    return res.json(category);
  } catch (error) {
    return res.status(400).json({ error: (error as any).message || 'Error updating category' });
  }
});

/**
 * Delete a Menu Category
 */
router.delete('/:categoryId', auth, async (req: any, res) => {
  try {
    const { categoryId } = req.params;

    const category = await MenuCategory.findById(categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const restaurant = await Restaurant.findById(category.restaurant_id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    // Only owner or admin can delete
    if (req.user.role !== 'admin' && restaurant.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this category' });
    }

    await category.deleteOne();
    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: (error as any).message || 'Error deleting category' });
  }
});

/**
 * Get all categories for a restaurant (sorted)
 */
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const categories = await MenuCategory.find({ restaurant_id: restaurantId }).sort({ sort_order: 1 });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: (error as any).message || 'Error fetching categories' });
  }
});

export default router;

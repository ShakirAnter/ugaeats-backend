import express from "express";
import { PromoCode } from "../models/PromoCode";
import { auth } from "../middleware/auth";

const router = express.Router();

/**
 * Get all active promo codes (public)
 */
router.get("/", async (req, res) => {
  try {
    const promos = await PromoCode.find({
      is_active: true,
      valid_until: { $gte: new Date() }
    }).select("code discount_type discount_value min_order_amount");

    return res.json(promos);
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

/**
 * Validate and apply a promo code
 */
router.post("/validate", auth, async (req: any, res) => {
  try {
    const { code, order_total } = req.body;
    const userId = req.user._id;

    if (!code) {
      return res.status(400).json({ error: "Promo code is required" });
    }

    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      is_active: true,
      valid_until: { $gte: new Date() }
    });

    if (!promo) {
      return res.status(404).json({ error: "Invalid or expired promo code" });
    }

    // Check minimum order amount
    if (order_total < promo.min_order_amount) {
      return res.status(400).json({
        error: `Minimum order amount of ${promo.min_order_amount} required`,
      });
    }

    // Check usage limit
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return res.status(400).json({ error: "Promo code usage limit exceeded" });
    }

    // Calculate discount
    let discount = 0;
    if (promo.discount_type === "percentage") {
      discount = (order_total * promo.discount_value) / 100;
      if (promo.max_discount) {
        discount = Math.min(discount, promo.max_discount);
      }
    } else {
      discount = promo.discount_value;
    }

    return res.json({
      valid: true,
      code: promo.code,
      discount,
      discount_type: promo.discount_type,
      final_total: Math.max(0, order_total - discount),
    });
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

/**
 * Apply promo code to order (called after order placement)
 */
router.post("/apply/:promoId", auth, async (req: any, res) => {
  try {
    const { promoId } = req.params;

    const promo = await PromoCode.findById(promoId);
    if (!promo) return res.status(404).json({ error: "Promo code not found" });

    promo.usage_count = (promo.usage_count || 0) + 1;
    await promo.save();

    return res.json({ message: "Promo code applied", usage_count: promo.usage_count });
  } catch (error) {
    return res.status(500).json({ error: (error as any).message });
  }
});

export default router;

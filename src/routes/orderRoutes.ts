import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController";
import { auth } from "../middleware/auth";
// import { adminOrRestaurantMiddleware } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/", auth, createOrder);
router.get("/", auth, getUserOrders);
router.get("/:id", auth, getOrderById);
router.put("/:id/status", auth, updateOrderStatus);
router.put("/:id/cancel", auth, cancelOrder);

export default router;

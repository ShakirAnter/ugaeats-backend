import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  acceptOrder,
  getAvailableOrders,
  updateDeliveryStatus,
  getRiderOrders,
} from "../controllers/orderController";
import { auth } from "../middleware/auth";
// import { adminOrRestaurantMiddleware } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/", auth, createOrder);
router.get("/available", auth, getAvailableOrders);
router.get("/rider/my-deliveries", auth, getRiderOrders);
router.get("/my-orders", auth, getUserOrders);
router.get("/", auth, getUserOrders);
router.get("/:id", auth, getOrderById);
router.put("/:id/status", auth, updateOrderStatus);
router.put("/:id/delivery-status", auth, updateDeliveryStatus);
router.put("/:id/cancel", auth, cancelOrder);
router.put("/:id/accept", auth, acceptOrder);

export default router;

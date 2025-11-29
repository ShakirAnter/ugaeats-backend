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
// convenience route for explicit history access (some clients may prefer a stable path)
router.get("/my-orders/history", auth, (req, res, next) => {
  // build a shallow fake request with a history flag so we don't mutate incoming request
  const fakeReq = { ...(req as any), query: { ...(req as any).query, history: '1' } } as any;
  return getUserOrders(fakeReq, res as any);
});
router.get("/", auth, getUserOrders);
router.get("/:id", auth, getOrderById);
router.put("/:id/status", auth, updateOrderStatus);
router.put("/:id/delivery-status", auth, updateDeliveryStatus);
router.put("/:id/cancel", auth, cancelOrder);
router.put("/:id/accept", auth, acceptOrder);

export default router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
// import { adminOrRestaurantMiddleware } from "../middleware/roleMiddleware";
const router = express_1.default.Router();
router.post("/", auth_1.auth, orderController_1.createOrder);
router.get("/available", auth_1.auth, orderController_1.getAvailableOrders);
router.get("/rider/my-deliveries", auth_1.auth, orderController_1.getRiderOrders);
router.get("/my-orders", auth_1.auth, orderController_1.getUserOrders);
// convenience route for explicit history access (some clients may prefer a stable path)
router.get("/my-orders/history", auth_1.auth, (req, res, next) => {
    // build a shallow fake request with a history flag so we don't mutate incoming request
    const fakeReq = { ...req, query: { ...req.query, history: '1' } };
    return (0, orderController_1.getUserOrders)(fakeReq, res);
});
router.get("/", auth_1.auth, orderController_1.getUserOrders);
router.get("/:id", auth_1.auth, orderController_1.getOrderById);
router.put("/:id/status", auth_1.auth, orderController_1.updateOrderStatus);
router.put("/:id/delivery-status", auth_1.auth, orderController_1.updateDeliveryStatus);
router.put("/:id/cancel", auth_1.auth, orderController_1.cancelOrder);
router.put("/:id/accept", auth_1.auth, orderController_1.acceptOrder);
exports.default = router;

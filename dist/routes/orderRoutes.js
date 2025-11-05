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
router.get("/", auth_1.auth, orderController_1.getUserOrders);
router.get("/:id", auth_1.auth, orderController_1.getOrderById);
router.put("/:id/status", auth_1.auth, orderController_1.updateOrderStatus);
router.put("/:id/cancel", auth_1.auth, orderController_1.cancelOrder);
exports.default = router;

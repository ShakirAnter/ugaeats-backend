"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const riderController_1 = require("../controllers/riderController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Rider registration and profile management
router.post("/register", auth_1.auth, riderController_1.registerRider);
router.get("/profile", auth_1.auth, riderController_1.getRiderProfile);
router.put("/availability", auth_1.auth, riderController_1.updateRiderAvailability);
router.put("/location", auth_1.auth, riderController_1.updateRiderLocation);
// Get available riders and specific rider info
router.get("/available", riderController_1.getAvailableRiders);
router.get("/:riderId", riderController_1.getRiderById);
exports.default = router;

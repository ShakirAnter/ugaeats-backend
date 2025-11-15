import express from "express";
import {
  registerRider,
  getRiderProfile,
  updateRiderAvailability,
  updateRiderLocation,
  getAvailableRiders,
  getRiderById,
} from "../controllers/riderController";
import { auth } from "../middleware/auth";

const router = express.Router();

// Rider registration and profile management
router.post("/register", auth, registerRider);
router.get("/profile", auth, getRiderProfile);
router.put("/availability", auth, updateRiderAvailability);
router.put("/location", auth, updateRiderLocation);

// Get available riders and specific rider info
router.get("/available", getAvailableRiders);
router.get("/:riderId", getRiderById);

export default router;

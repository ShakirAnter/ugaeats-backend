import express from "express";
import { User } from "../models/User";
import { auth } from "../middleware/auth";

const router = express.Router();

/**
 * Add new address
 */
router.post("/", auth, async (req: any, res) => {
  try {
    const { label, address, latitude, longitude } = req.body;

    if (!address || !latitude || !longitude) {
      return res.status(400).json({ error: "Incomplete address data" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.addresses) {
      user.addresses = []; // initialize if it doesn’t exist
    }

    user.addresses.push({ label, address, latitude, longitude });
    await user.save();

    res.json(user.addresses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update an address
 */
router.put("/:addressId", auth, async (req: any, res) => {
  try {
    const { label, address, latitude, longitude } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Ensure addresses array exists
    if (!user.addresses) user.addresses = [];

    const index = user.addresses.findIndex(
      (addr) => addr._id?.toString() === req.params.addressId
    );

    if (index === -1)
      return res.status(404).json({ error: "Address not found" });

    // Update the address directly
    user.addresses[index] = {
      ...(user.addresses[index] ?? user.addresses[index]), // fallback in case toObject exists
      label,
      address,
      latitude,
      longitude,
    };

    await user.save();

    res.json(user.addresses[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove an address
 */
router.delete("/:addressId", auth, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.addresses) {
      return res.status(400).json({ message: "No addresses found" });
    }

    user.addresses = user.addresses.filter(
      (addr) => addr._id?.toString() !== req.params.addressId
    );
    await user.save();

    res.json(user.addresses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all addresses
 */
router.get("/", auth, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.addresses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

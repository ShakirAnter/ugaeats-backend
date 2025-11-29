"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * Add new address
 */
router.post("/", auth_1.auth, async (req, res) => {
    try {
        const { label, address, latitude, longitude } = req.body;
        if (!address || !latitude || !longitude) {
            return res.status(400).json({ error: "Incomplete address data" });
        }
        const user = await User_1.User.findById(req.user._id);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        if (!user.addresses) {
            user.addresses = []; // initialize if it doesn’t exist
        }
        user.addresses.push({ label, address, latitude, longitude });
        await user.save();
        res.json(user.addresses);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Update an address
 */
router.put("/:addressId", auth_1.auth, async (req, res) => {
    var _a;
    try {
        const { label, address, latitude, longitude } = req.body;
        const user = await User_1.User.findById(req.user._id);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        // Ensure addresses array exists
        if (!user.addresses)
            user.addresses = [];
        const index = user.addresses.findIndex((addr) => { var _a; return ((_a = addr._id) === null || _a === void 0 ? void 0 : _a.toString()) === req.params.addressId; });
        if (index === -1)
            return res.status(404).json({ error: "Address not found" });
        // Update the address directly
        user.addresses[index] = {
            ...((_a = user.addresses[index]) !== null && _a !== void 0 ? _a : user.addresses[index]), // fallback in case toObject exists
            label,
            address,
            latitude,
            longitude,
        };
        await user.save();
        res.json(user.addresses[index]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Remove an address
 */
router.delete("/:addressId", auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user._id);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        if (!user.addresses) {
            return res.status(400).json({ message: "No addresses found" });
        }
        user.addresses = user.addresses.filter((addr) => { var _a; return ((_a = addr._id) === null || _a === void 0 ? void 0 : _a.toString()) !== req.params.addressId; });
        await user.save();
        res.json(user.addresses);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get all addresses
 */
router.get("/", auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user._id);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json(user.addresses);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;

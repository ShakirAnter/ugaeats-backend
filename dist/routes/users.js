"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const uploadToCloudinary_1 = require("../middleware/uploadToCloudinary");
const cloudinary_1 = require("cloudinary");
const phone_1 = require("../utils/phone");
const router = express_1.default.Router();
// Get user profile
router.get("/me", auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}, 
// Update user profile (including profile image)
// Update restaurant (owner or admin). Supports replacing the restaurant image via `image` field.
router.patch("/:id", auth_1.auth, (0, uploadToCloudinary_1.singleUploadToCloudinary)("avatar", "avatar_url", "UgaEats/avatars"), async (req, res) => {
    try {
        const user = await User_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (req.file || req.body.avatar_url) {
            // old image
            const oldPublicId = user.avatar_public_id;
            if (oldPublicId) {
                try {
                    await cloudinary_1.v2.uploader.destroy(oldPublicId);
                }
                catch (destroyErr) {
                    console.warn("Failed to delete old avatar from Cloudinary", destroyErr);
                }
            }
            // persist new image fields
            if (req.body.avatar_url_public_id) {
                user.avatar_public_id = req.body.avatar_url_public_id;
            }
            if (req.body.image_url) {
                user.avatar_url = req.body.avatar_url;
            }
        }
        Object.assign(user, req.body);
        await user.save();
        return res.json(user);
    }
    catch (error) {
        console.error("Error updating restaurant:", error);
        return res.status(400).json({
            error: (error === null || error === void 0 ? void 0 : error.message) || "Error updating restaurant",
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
    }
}));
// Change user password
router.post("/change-password", auth_1.auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            return res
                .status(400)
                .json({ error: "Current password and new password are required" });
        }
        const user = await User_1.User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Compare current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }
        // Update to new password
        user.password = newPassword;
        await user.save();
        res.json({ message: "Password changed successfully" });
    }
    catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});
// Change phone number directly (no verification)
router.post("/change-phone", auth_1.auth, async (req, res) => {
    try {
        const { newPhone } = req.body;
        if (!newPhone)
            return res.status(400).json({ error: "New phone number is required" });
        // ✅ Normalize & validate
        const normalizedPhone = (0, phone_1.normalizeUgandaPhone)(newPhone);
        if (!normalizedPhone) {
            return res.status(400).json({
                error: "Phone number must be a valid Uganda number (e.g. 0768057482 or +256768057482).",
            });
        }
        const user = await User_1.User.findById(req.user._id);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        // ✅ Prevent duplicate numbers
        const existingUser = await User_1.User.findOne({
            phone: normalizedPhone,
            _id: { $ne: user._id },
        });
        if (existingUser) {
            return res
                .status(400)
                .json({ error: "This phone number is already registered." });
        }
        // ✅ Update
        user.phone = normalizedPhone;
        await user.save();
        res.json({
            message: "Phone number updated successfully.",
            user,
        });
    }
    catch (error) {
        console.error("Error changing phone:", error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;

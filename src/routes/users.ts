import express from "express";
import { auth } from "../middleware/auth";
import { User } from "../models/User";
import { singleUploadToCloudinary } from "../middleware/uploadToCloudinary";
import { v2 as cloudinary } from "cloudinary";
import { normalizeUgandaPhone } from "../utils/phone";
import { sendVerificationCode, verifyCode } from "../utils/twilio";
import { sendSMS } from "../utils/sms";

const router = express.Router();

// Get user profile
router.get(
  "/me",
  auth,
  async (req: any, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update user profile (including profile image)
  // Update restaurant (owner or admin). Supports replacing the restaurant image via `image` field.
  router.patch(
    "/:id",
    auth,
    singleUploadToCloudinary("avatar", "avatar_url", "UgaEats/avatars"),
    async (req: any, res) => {
      try {
        const user = await User.findById(req.params.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (req.file || req.body.avatar_url) {
          // old image
          const oldPublicId = user.avatar_public_id;
          if (oldPublicId) {
            try {
              await cloudinary.uploader.destroy(oldPublicId);
            } catch (destroyErr) {
              console.warn(
                "Failed to delete old avatar from Cloudinary",
                destroyErr
              );
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
      } catch (error: any) {
        console.error("Error updating restaurant:", error);
        return res.status(400).json({
          error: error?.message || "Error updating restaurant",
          stack: error?.stack,
        });
      }
    }
  )
);

// Change user password
router.post("/change-password", auth, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    const user = await User.findById(req.user._id);
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
  } catch (error: any) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Change phone number directly (no verification)
router.post("/change-phone", auth, async (req: any, res) => {
  try {
    const { newPhone } = req.body;
    if (!newPhone)
      return res.status(400).json({ error: "New phone number is required" });

    // ✅ Normalize & validate
    const normalizedPhone = normalizeUgandaPhone(newPhone);
    if (!normalizedPhone) {
      return res.status(400).json({
        error:
          "Phone number must be a valid Uganda number (e.g. 0768057482 or +256768057482).",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Prevent duplicate numbers
    const existingUser = await User.findOne({
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
  } catch (error: any) {
    console.error("Error changing phone:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

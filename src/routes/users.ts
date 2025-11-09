import express from "express";
import { auth } from "../middleware/auth";
import { User } from "../models/User";
import { singleUploadToCloudinary } from "../middleware/uploadToCloudinary";
import { v2 as cloudinary } from "cloudinary";
import { normalizeUgandaPhone } from "../utils/phone";

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

export default router;

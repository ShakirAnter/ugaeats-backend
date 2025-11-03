import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { normalizeUgandaPhone } from '../utils/phone';
import { auth } from '../middleware/auth';
import { singleUploadToCloudinary } from '../middleware/uploadToCloudinary';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role, phone } = req.body;

    // Normalize phone (accept local 0XXXXXXXXX or raw 9 digits)
    const normalizedPhone = normalizeUgandaPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Phone number must be a valid Uganda number (e.g. 0768057482 or +256768057482).' });
    }

    // Check if user already exists by email or phone
    const existingUser = await User.findOne({ $or: [{ email }, { phone: normalizedPhone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone already registered' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      full_name,
      role: role || 'customer',
      phone: normalizedPhone
    });

    await user.save();
    const token = await user.generateAuthToken();

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: (error as any)?.message || String(error) });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'This email address is not registered.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid Password' });
    }

    const token = await user.generateAuthToken();
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: (error as any)?.message || String(error) });
  }
});

// Get current user
router.get('/me', auth, async (req: any, res) => {
  res.json(req.user);
});

// Update user profile
router.patch('/me', auth, singleUploadToCloudinary('avatar', 'avatar_url', 'UgaEats/avatars'), async (req: any, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['full_name', 'phone', 'email', 'password', 'avatar_url', 'avatar_url_public_id'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates!' });
  }

  try {
    // If phone is being updated, accept local format (0XXXXXXXXX) or international (+256XXXXXXXXX)
    // and normalize to +256XXXXXXXXX before saving.
    if (updates.includes('phone')) {
      let phoneVal = (req.body.phone as string) || '';
      phoneVal = phoneVal.replace(/[\s-]/g, ''); // strip spaces/dashes
      const localRegex = /^0\d{9}$/;
      const intlRegex = /^\+256\d{9}$/;

      if (localRegex.test(phoneVal)) {
        // convert local to international
        phoneVal = '+256' + phoneVal.slice(1);
        req.body.phone = phoneVal;
      } else if (!intlRegex.test(phoneVal)) {
        return res.status(400).json({ error: 'Phone number must be either local 0XXXXXXXXX or international +256XXXXXXXXX. It will be normalized to +256 format.' });
      } else {
        // already in international format, ensure it's the sanitized version
        req.body.phone = phoneVal;
      }
    }
    // If a new avatar was uploaded, remove the old avatar from Cloudinary (if present)
    if (updates.includes('avatar_url') && req.body.avatar_url_public_id) {
      const oldPublicId = req.user.avatar_public_id;
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (destroyErr) {
          // don't block the update if deletion fails; just log
          // eslint-disable-next-line no-console
          console.warn('Failed to delete old avatar from Cloudinary', destroyErr);
        }
      }
      // make sure avatar_public_id from middleware is persisted to user
      req.user.avatar_public_id = req.body.avatar_url_public_id;
    }

    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ error: (error as any)?.message || String(error) });
  }
});

export default router;
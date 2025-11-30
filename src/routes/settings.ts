import express from 'express';
import { Settings } from '../models/Settings';

const router = express.Router();

// Public settings endpoint — read-only global settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) settings = await Settings.create({ key: 'global' });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

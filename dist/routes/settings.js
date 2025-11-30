"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Settings_1 = require("../models/Settings");
const router = express_1.default.Router();
// Public settings endpoint — read-only global settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings_1.Settings.findOne({ key: 'global' });
        if (!settings)
            settings = await Settings_1.Settings.create({ key: 'global' });
        res.json(settings);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
